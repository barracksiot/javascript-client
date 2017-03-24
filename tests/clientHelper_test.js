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
    expect(result.available[0]).to.deep.equals(
      Object.assign({}, component, {
        package: component.component,
        component: undefined
      })
    );      
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
    expect(result.changed[0]).to.deep.equals(
      Object.assign({}, component, {
        package: component.component,
        component: undefined
      })
    );      
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
    expect(result.unchanged[0]).to.deep.equals(
      Object.assign({}, component, {
        package: component.component,
        component: undefined
      })
    );      
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
    expect(result.unavailable[0]).to.deep.equals(
      Object.assign({}, component, {
        package: component.component,
        component: undefined
      })
    );
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
    expect(result.available[0]).to.deep.equals(
      Object.assign({}, availableComponent, {
        package: availableComponent.component,
        component: undefined
      })
    );
    expect(result.changed[0]).to.deep.equals(
      Object.assign({}, changedComponent, {
        package: changedComponent.component,
        component: undefined
      })
    );
    expect(result.unchanged[0]).to.deep.equals(
      Object.assign({}, unchangedComponent, {
        package: unchangedComponent.component,
        component: undefined
      })
    );
    expect(result.unavailable[0]).to.deep.equals(
      Object.assign({}, unavailableComponent, {
        package: unavailableComponent.component,
        component: undefined
      })
    );
  });
});