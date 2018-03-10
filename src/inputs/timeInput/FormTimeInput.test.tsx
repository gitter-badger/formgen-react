/* tslint:disable:no-any jsx-no-lambda no-string-literal */
import * as React from 'react';
import * as ReactTestUtils from 'react-dom/test-utils';
import * as sinon from 'sinon';
import { Form } from '../../form/Form';
import { DEFAULT_DEBOUNCE } from '../../formBaseInput/FormBaseInput';
import { PrimaryButton } from 'office-ui-fabric-react';
import { FormTimeInput } from './FormTimeInput';
var jsonForm = require('./FormTimeInput.test.json');

describe('FormTimeInput Unit Tests', () => {
  describe('Renders for combinations of props', () => {
    let renderedForm: Form;
    let renderedInput: HTMLInputElement;

    beforeEach(() => {
      (renderedForm as any) = undefined;
      (renderedInput as any) = undefined;
    });

    it('With initial value', () => {
      let result: any;
      renderedForm = ReactTestUtils.renderIntoDocument(
        <Form jsonFormData={ jsonForm }  onSubmitForm={ (formData: any) => { result = formData; } } 
        />
      ) as Form;

      renderedInput = ReactTestUtils.findRenderedDOMComponentWithTag(renderedForm, 'input') as HTMLInputElement;
      
      let form: HTMLFormElement = ReactTestUtils.findRenderedDOMComponentWithTag(renderedForm, 'form') as HTMLFormElement;
      ReactTestUtils.Simulate.submit(form);
      let outValue = result["rows"]["0"]["columns"][0]["controls"][0]["value"];
      expect(outValue).toEqual(39600);
    });
  });

  describe('TimeInput update tests', () => {
    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
      clock = sinon.useFakeTimers(Date.now());
    });

    afterEach(() => {
      clock.restore();
    });

    it('TimeInput is leading and trailing debounced', () => {
        let updateStub: sinon.SinonStub = sinon.stub();
        let renderedForm = ReactTestUtils.renderIntoDocument(
            <Form jsonFormData={ jsonForm } onUpdated={ updateStub } />
        ) as Form;
     
        let textInput: FormTimeInput = ReactTestUtils.findRenderedComponentWithType(renderedForm, FormTimeInput);
        textInput.setValue(32400, true);
        expect(updateStub.callCount).toEqual(0);
        clock.tick(DEFAULT_DEBOUNCE);
        expect(updateStub.callCount).toEqual(1);
        let renderedInput = ReactTestUtils.findRenderedDOMComponentWithTag(renderedForm, 'input') as HTMLInputElement;
        expect(renderedInput.value).toEqual("09:00"); //Is 32400 Seconds
    });
  });

  describe('Common validations', () => {

    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
      clock = sinon.useFakeTimers(Date.now());
    });

    afterEach(() => {
      clock.restore();
    });    

    it('Validators run properly', () => {
      let renderedForm = ReactTestUtils.renderIntoDocument(
        <Form jsonFormData={ jsonForm } onSubmitForm={ undefined } />
      ) as Form;

      let formField = ReactTestUtils.findRenderedComponentWithType(renderedForm, FormTimeInput);
      formField.setValue(43200, true);
      clock.tick(DEFAULT_DEBOUNCE);
      expect(formField.state.currentError).toEqual("max 09:00");
      
      formField.setValue(undefined, true);
      clock.tick(DEFAULT_DEBOUNCE);
      
      let submitButton: PrimaryButton = ReactTestUtils.findRenderedComponentWithType(renderedForm, PrimaryButton);
      expect(submitButton.props.disabled).toBeTruthy();
    });
  }); 
});