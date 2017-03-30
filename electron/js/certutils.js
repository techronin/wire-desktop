/*
 * Wire
 * Copyright (C) 2016 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

'use strict';

const config = require('./config');
const crypto = require('crypto');
const rs = require('jsrsasign');

const MAIN_FP = '3pHQns2wdYtN4b2MWsMguGw70gISyhBZLZDpbj+EmdU=';
const ALGORITHM_RSA = '2a864886f70d010101';
const DIGICERT_EV_ROOT='-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxszlc+b71LvlLS0ypt/l\ngT/JzSVJtnEqw9WUNGeiChywX2mmQLHEt7KP0JikqUFZOtPclNY823Q4pErMTSWC\n90qlUxI47vNJbXGRfmO2q6Zfw6SE+E9iUb74xezbOJLjBuUIkQzEKEFV+8taiRV+\nceg1v01yCT2+OjhQW3cxG42zxyRFmqesbQAUWgS3uhPrUQqYQUEiTmVhh4FBUKZ5\nXIneGUpX1S7mXRxTLH6YzRoGFqRoc9A0BBNcoXHTWnxV215k4TeHMFYE5RG0KYAS\n8Xk5iKICEXwnZreIt3jyygqoOKsKZMK/Zl2VhMGhJR6HXRpQCyASzEG7bgtROLhL\nywIDAQAB\n-----END PUBLIC KEY-----';
const strip = (url) => url.replace(/https:|[\/]+/g, '');
const pins = [
  {
    url: strip(config.PROD_URL),
    publicKeyInfo: {
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: ['bORoZ2vRsPJ4WBsUdL1h3Q7C50ZaBqPwngDmDVw+wHA=', MAIN_FP],
      issuerRootPubkeys: [DIGICERT_EV_ROOT],
    },
  },
  {
    url: 'wire.com',
    publicKeyInfo: {
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    },
  },
  {
    url: 'www.wire.com',
    publicKeyInfo: {
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    },
  },
  {
    url: 'prod-nginz-https.wire.com',
    publicKeyInfo: {
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    },
  },
  {
    url: 'prod-nginz-ssl.wire.com',
    publicKeyInfo: {
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    },
  },
  {
    url: 'prod-assets.wire.com',
    publicKeyInfo: {
      algorithmID: ALGORITHM_RSA,
      algorithmParam: null,
      fingerprints: [MAIN_FP],
    },
  },
];

module.exports = {
  hostnameShouldBePinned (hostname) {
    return pins.some((pin) => pin.url.toLowerCase().trim() === hostname.toLowerCase().trim());
  },

  verifyPinning (hostname, certificate) {
    const {data: certData = '', issuerCert: {data: issuerCertData = ''} = {}} = certificate;

    const issuerCert = rs.ASN1HEX.pemToHex(issuerCertData);
    const publicKey = rs.X509.getPublicKeyInfoPropOfCertPEM(certData);
    const publicKeyBytes = Buffer.from(publicKey.keyhex, 'hex').toString('binary');
    const publicKeyFingerprint = crypto.createHash('sha256').update(publicKeyBytes).digest('base64');
    const result = {};

    for (let pin of pins) {
      const {url = '', publicKeyInfo: {fingerprints = [], algorithmID = '', algorithmParam} = {}, issuerRootPubkeys = []} = pin;
      if (url === hostname) {
        result.verifiedIssuerRootPubkeys = (issuerRootPubkeys.length > 0) ? issuerRootPubkeys.some((pubkey) => rs.X509.verifySignature(issuerCert, rs.KEYUTIL.getKey(pubkey))) : undefined;
        result.verifiedFingerprints = (fingerprints.length > 0) ? fingerprints.some((fingerprint) => fingerprint === publicKeyFingerprint) : undefined;
        result.verifiedPublicKeyAlgorithmID = algorithmID === publicKey.algoid;
        result.verifiedPublicKeyAlgorithmParam = algorithmParam === publicKey.algparam;
        break;
      }
    }
    return result;
  },
};
