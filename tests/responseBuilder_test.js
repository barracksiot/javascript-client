/* jshint expr: true, maxstatements: 100 */
/* global describe, it */

var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
var builder = require('../src/responseBuilder');

describe('buildResponse : ', function () {

  var downloadPackage = function () {};

  it('Should add a download function to the available packages', function () {
    // Given
    var package1 = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var package2 = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var body = {
      available: [ package1, package2 ],
      changed: [],
      unchanged: [],
      unavailable: []
    };

    // When
    var result = builder.buildResponse(body, downloadPackage);

    // Then
    expect(result.available[0]).to.have.property('reference').and.to.be.equals(package1.reference);
    expect(result.available[0]).to.have.property('version').and.to.be.equals(package1.version);
    expect(result.available[0]).to.have.property('download').and.to.be.a('function');
    expect(result.available[1]).to.have.property('reference').and.to.be.equals(package2.reference);
    expect(result.available[1]).to.have.property('version').and.to.be.equals(package2.version);
    expect(result.available[1]).to.have.property('download').and.to.be.a('function');
    expect(result.changed).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unchanged).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unavailable).to.be.an('array').and.to.have.lengthOf(0);
  });

  it('Should add a download function to the changed packages', function () {
    // Given
    var package1 = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var package2 = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var body = {
      available: [],
      changed: [ package1, package2 ],
      unchanged: [],
      unavailable: []
    };

    // When
    var result = builder.buildResponse(body, downloadPackage);

    // Then
    expect(result.available).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.changed[0]).to.have.property('reference').and.to.be.equals(package1.reference);
    expect(result.changed[0]).to.have.property('version').and.to.be.equals(package1.version);
    expect(result.changed[0]).to.have.property('download').and.to.be.a('function');
    expect(result.changed[1]).to.have.property('reference').and.to.be.equals(package2.reference);
    expect(result.changed[1]).to.have.property('version').and.to.be.equals(package2.version);
    expect(result.changed[1]).to.have.property('download').and.to.be.a('function');
    expect(result.unchanged).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unavailable).to.be.an('array').and.to.have.lengthOf(0);
  });

  it('Should change the unchanged packages', function () {
    // Given
    var package1 = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var package2 = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var body = {
      available: [],
      changed: [],
      unchanged: [ package1, package2 ],
      unavailable: []
    };

    // When
    var result = builder.buildResponse(body, downloadPackage);

    // Then
    expect(result.available).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.changed).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unchanged[0]).to.have.property('reference').and.to.be.equals(package1.reference);
    expect(result.unchanged[0]).to.have.property('version').and.to.be.equals(package1.version);
    expect(result.unchanged[0]).to.not.have.property('download');
    expect(result.unchanged[1]).to.have.property('reference').and.to.be.equals(package2.reference);
    expect(result.unchanged[1]).to.have.property('version').and.to.be.equals(package2.version);
    expect(result.unchanged[1]).to.not.have.property('download');
    expect(result.unavailable).to.be.an('array').and.to.have.lengthOf(0);
  });

  it('Should change the unavailable packages', function () {
    // Given
    var package1 = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var package2 = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var body = {
      available: [],
      changed: [],
      unchanged: [],
      unavailable: [ package1, package2 ]
    };

    // When
    var result = builder.buildResponse(body, downloadPackage);

    // Then
    expect(result.available).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.changed).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unchanged).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unavailable[0]).to.have.property('reference').and.to.be.equals(package1.reference);
    expect(result.unavailable[0]).to.have.property('version').and.to.be.equals(package1.version);
    expect(result.unavailable[0]).to.not.have.property('download');
    expect(result.unavailable[1]).to.have.property('reference').and.to.be.equals(package2.reference);
    expect(result.unavailable[1]).to.have.property('version').and.to.be.equals(package2.version);
    expect(result.unavailable[1]).to.not.have.property('download');
  });

  it('Should bind object with given function', function () {
    // Given
    var package = {
      reference: 'plop',
      version: 'plop1.1'
    };
    var body = {
      available: [ package ],
      changed: [],
      unchanged: [],
      unavailable: []
    };
    var downloadFunction = sinon.spy();
    var response = builder.buildResponse(body, downloadFunction);
    var filePath = 'path/to/file.sh';

    // When
    response.available[0].download(filePath);

    // Then
    expect(downloadFunction).to.have.been.calledOnce;
    expect(downloadFunction).to.have.been.calledWithExactly(package, filePath);
  });
});