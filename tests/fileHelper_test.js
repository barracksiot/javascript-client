/* jshint expr: true, maxstatements: 100 */
/* global describe, it, beforeEach */

var proxyquire =  require('proxyquire');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chai = require('chai');
var expect = chai.expect;

chai.use(sinonChai);

describe('checkMd5(file, validSum) : ', function () {

  var helper;
  var md5Mock = function () {};

  beforeEach(function () {
    helper = proxyquire('../src/fileHelper.js', {
      'md5-file/promise': function (file) {
        return md5Mock(file);
      }
    });
  });

  it('Should throw ERROR_CHECKSUM_VERIFICATION_FAILED when checksum do not match', function (done) {
    // Given
    var expectedChecksum = '345678iokmnbvcdertyghjkoi654e';
    var file = 'blahblahfile';
    var fileChecksum = 'kjhgfdsdfghj';
    var md5Spy = sinon.spy();
    md5Mock = function (data) {
      md5Spy(data);
      return Promise.resolve(fileChecksum);
    };

    // When / Then
    helper.checkMd5(file, expectedChecksum).then(function () {
      done('Should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'CHECKSUM_VERIFICATION_FAILED',
        message: 'Checksum don\'t match'
      });
      expect(md5Spy).to.have.been.calledOnce;
      expect(md5Spy).to.have.been.calledWithExactly(file);
      done();
    });
  });

  it('Should throw ERROR_MD5_HASH_CREATION_FAILED when checksum fail to be generated', function (done) {
    // Given
    var expectedChecksum = '345678iokmnbvcdertyghjkoi654e';
    var file = 'blahblahfile';
    var error = 'md5 error';
    var md5Spy = sinon.spy();
    md5Mock = function (data) {
      md5Spy(data);
      return Promise.reject(error);
    };

    // When / Then
    helper.checkMd5(file, expectedChecksum).then(function () {
      done('Should have failed');
    }).catch(function (err) {
      expect(err).to.deep.equals({
        type: 'MD5_HASH_CREATION_FAILED',
        message: error
      });
      expect(md5Spy).to.have.been.calledOnce;
      expect(md5Spy).to.have.been.calledWithExactly(file);
      done();
    });
  });

  it('Should resolve when md5 match', function (done) {
    // Given
    var expectedChecksum = '345678iokmnbvcdertyghjkoi654e';
    var fileChecksum = expectedChecksum;
    var file = 'blahblahfile';
    var md5Spy = sinon.spy();
    md5Mock = function (data) {
      md5Spy(data);
      return Promise.resolve(fileChecksum);
    };

    // When / Then
    helper.checkMd5(file, expectedChecksum).then(function (result) {
      expect(result).to.be.equals(undefined);
      expect(md5Spy).to.have.been.calledOnce;
      expect(md5Spy).to.have.been.calledWithExactly(file);
      done();
    }).catch(function (err) {
      done(err);
    });
  });
});

describe('deleteFile(file, reject) : ', function () {

  var helper;
  var unlinkMock = function () {};

  beforeEach(function () {
    helper = proxyquire('../src/fileHelper.js', {
      'fs': {
        unlink: function (file, callback) {
          unlinkMock(file, callback);
        } 
      }
    });
  });

  it('Should reject ERROR_DELETE_FILE_FAILED when deletion fail', function () {
    // Given
    var filePath = 'path/to/file.txt';
    var error = 'fs error';
    var unlinkSpy = sinon.spy();
    unlinkMock = function (file, callback) {
      unlinkSpy(file, callback);
      callback(error);
    };
    var reject = sinon.spy();

    // When
    helper.deleteFile(filePath, reject);

    // Then
    expect(unlinkSpy).to.have.been.calledOnce;
    expect(unlinkSpy).to.have.been.calledWithExactly(
      filePath,
      sinon.match.func
    );
    expect(reject).to.have.been.calledOnce;
    expect(reject).to.have.been.calledWithExactly({
      type: 'DELETE_FILE_FAILED',
      message: 'Error when removing file ' + filePath + ': ' + error
    });
  });

  it('Should return nothing if deletion succeed', function () {
    // Given
    var filePath = 'path/to/file.txt';
    var unlinkSpy = sinon.spy();
    unlinkMock = function (file, callback) {
      unlinkSpy(file, callback);
      callback();
    };
    var reject = sinon.spy();

    // When
    helper.deleteFile(filePath, reject);

    // Then
    expect(unlinkSpy).to.have.been.calledOnce;
    expect(unlinkSpy).to.have.been.calledWithExactly(
      filePath,
      sinon.match.func
    );
    expect(reject).to.not.have.been.calledOnce;
  });
});












