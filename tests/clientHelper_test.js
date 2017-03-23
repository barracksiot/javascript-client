/* jshint expr: true, maxstatements: 100 */
/* global describe, it */

var chai = require('chai');
var expect = chai.expect;
var helper = require('../src/clientHelper.js');

describe('buildCheckUpdateResult : ', function () {

  it('Should correctly map packages in the available section', function () {
    // Given
    var component = {
      component: 'abc.edf',
      version: '0.0.1',
      url: 'https://dtc.io/',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    };
    var serverResponse = {
      available:[ component ],
      changed: [],
      unchanged: [],
      unavailable: []
    };

    // When
    var result = helper.buildCheckUpdateResult(serverResponse);

    // Then
    expect(result).to.be.an('object');
    expect(result.available).to.be.an('array').and.to.have.lengthOf(1);
    expect(result.changed).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unchanged).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unavailable).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.available[0]).to.deep.equals({
      package: 'abc.edf',
      version: '0.0.1',
      url: 'https://dtc.io/',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    });      
  });

  it('Should correctly map packages in the changed section', function () {
    // Given
    var component = {
      component: 'abc.edf',
      version: '0.0.1',
      url: 'https://dtc.io/',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    };
    var serverResponse = {
      available: [],
      changed: [ component ],
      unchanged: [],
      unavailable: []
    };

    // When
    var result = helper.buildCheckUpdateResult(serverResponse);

    // Then
    expect(result).to.be.an('object');
    expect(result.available).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.changed).to.be.an('array').and.to.have.lengthOf(1);
    expect(result.unchanged).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unavailable).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.changed[0]).to.deep.equals({
      package: 'abc.edf',
      version: '0.0.1',
      url: 'https://dtc.io/',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    });      
  });

  it('Should correctly map packages in the unchanged section', function () {
    // Given
    var component = {
      component: 'abc.edf',
      version: '0.0.1'
    };
    var serverResponse = {
      available: [],
      changed: [],
      unchanged: [ component ],
      unavailable: []
    };

    // When
    var result = helper.buildCheckUpdateResult(serverResponse);

    // Then
    expect(result).to.be.an('object');
    expect(result.available).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.changed).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unchanged).to.be.an('array').and.to.have.lengthOf(1);
    expect(result.unavailable).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unchanged[0]).to.deep.equals({
      package: 'abc.edf',
      version: '0.0.1'
    });      
  });

  it('Should correctly map packages in the unavailable section', function () {
    // Given
    var component = { component: 'abc.edf' };
    var serverResponse = {
      available: [],
      changed: [],
      unchanged: [],
      unavailable: [ component ]
    };

    // When
    var result = helper.buildCheckUpdateResult(serverResponse);

    // Then
    expect(result).to.be.an('object');
    expect(result.available).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.changed).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unchanged).to.be.an('array').and.to.have.lengthOf(0);
    expect(result.unavailable).to.be.an('array').and.to.have.lengthOf(1);
    expect(result.unavailable[0]).to.deep.equals({ package: 'abc.edf' });
  });

  it('Should correctly map packages in all sections', function () {
    // Given
    var availableComponent = {
      component: 'abc.edf',
      version: '0.0.1',
      url: 'https://dtc.io/',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    };
    var changedComponent = {
      component: 'abc.edf',
      version: '0.0.1',
      url: 'https://dtc.io/',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    };
    var unchangedComponent = {
      component: 'abc.edf',
      version: '0.0.1'
    };
    var unavailableComponent = { component: 'abc.edf' };
    var serverResponse = {
      available: [ availableComponent ],
      changed: [ changedComponent ],
      unchanged: [ unchangedComponent ],
      unavailable: [ unavailableComponent ]
    };
    
    // When
    var result = helper.buildCheckUpdateResult(serverResponse);

    // Then
    expect(result).to.be.an('object');
    expect(result.available).to.be.an('array').and.to.have.lengthOf(1);
    expect(result.changed).to.be.an('array').and.to.have.lengthOf(1);
    expect(result.unchanged).to.be.an('array').and.to.have.lengthOf(1);
    expect(result.unavailable).to.be.an('array').and.to.have.lengthOf(1);
    expect(result.available[0]).to.deep.equals({
      package: 'abc.edf',
      version: '0.0.1',
      url: 'https://dtc.io/',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    });
    expect(result.changed[0]).to.deep.equals({
      package: 'abc.edf',
      version: '0.0.1',
      url: 'https://dtc.io/',
      size: 42,
      md5: 'deadbeefbadc0ffee'
    });
    expect(result.unchanged[0]).to.deep.equals({
      package: 'abc.edf',
      version: '0.0.1'
    });
    expect(result.unavailable[0]).to.deep.equals({ package: 'abc.edf' });
  });
});