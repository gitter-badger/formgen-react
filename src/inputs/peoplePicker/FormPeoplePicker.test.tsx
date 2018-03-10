/* tslint:disable:no-any jsx-no-lambda no-string-literal */
import * as React from 'react';
import * as ReactTestUtils from 'react-dom/test-utils';
import * as sinon from 'sinon';
import { Form } from '../../form/Form';
import { BinderType } from '../../Enums';
import { DataBinder } from '../../objects/DataBinder';
import { Control } from '../../objects/Control';
import { IPersonaProps } from 'office-ui-fabric-react';
import { FormPeoplePicker } from './FormPeoplePicker';
var jsonForm = require('./FormPeoplePicker.test.json');

function _doesTextStartWith(text: string, filterText: string): boolean {
  return text.toLowerCase().indexOf(filterText.toLowerCase()) === 0;
}

const selKey = [{"primaryText":"Muster Hans"}];
const newKey = [{"primaryText":"Muster Fritz"}];

describe('FormDropdown Unit Tests', () => {
  describe('Renders for all combinations of props', () => {
    let renderedForm: Form;
    let renderedInput: HTMLInputElement;

    beforeEach(() => {
      (renderedForm as any) = undefined;
      (renderedInput as any) = undefined;
    });

    it('With initial value', () => {
      const binders:DataBinder[] = [{
        typeName: "testform.pepoplepicker_filteredPeoples",
        binderType: BinderType.AsyncFilter,  
        binderFunction: {
          retrieveData(controlConfig: Control, lang:string, filterText: string):Promise<any[]> {
           return new Promise<any[]>((resolve, reject)  => {
              let dropDonwEntries:IPersonaProps[] = [{
                primaryText: "Muster Hans"
              },
              {
                primaryText: "Muster Fritz"
              },
              {
                primaryText: "Muster Daniela"
              },
              {
                primaryText: "Muster Angela"
              }];
              let filtered = dropDonwEntries.filter(item => _doesTextStartWith(item.primaryText as string, filterText));
              resolve(filtered);
            });
          }
        }
      }]

      let result: any;
      renderedForm = ReactTestUtils.renderIntoDocument(
        <Form jsonFormData={ jsonForm } dataBinders={ binders } onSubmitForm={ (formData: any) => { result = formData; } } />
      ) as Form;

      renderedInput = ReactTestUtils.findRenderedDOMComponentWithClass(renderedForm, 'ms-BasePicker-input') as HTMLInputElement;
      let form: HTMLFormElement = ReactTestUtils.findRenderedDOMComponentWithTag(renderedForm, 'form') as HTMLFormElement;
      ReactTestUtils.Simulate.submit(form);
      let outValue = result["rows"]["0"]["columns"][0]["controls"][0]["value"];
      expect(outValue).toEqual(selKey);
    });
  });

  describe('Dropdown update tests', () => {
    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
      clock = sinon.useFakeTimers(Date.now());
    });

    afterEach(() => {
      clock.restore();
    });

    it('PeoplePicker is updating', () => {
        let updateStub: sinon.SinonStub = sinon.stub();
        let renderedForm = ReactTestUtils.renderIntoDocument(
            <Form jsonFormData={ jsonForm } onUpdated={ updateStub } />
        ) as Form;
     
        let picker: FormPeoplePicker = ReactTestUtils.findRenderedComponentWithType(renderedForm, FormPeoplePicker);
        picker.setValue(newKey);
        expect(updateStub.callCount).toEqual(1);
    });
  });
});