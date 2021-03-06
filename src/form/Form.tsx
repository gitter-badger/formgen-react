import 'core-js/es6/map';
import 'core-js/es6/set';
import * as React from 'react';
import { ObjectFabric } from '../objects/ObjectFabric';
import { Helper } from '../Helper';
import { loadTheme } from 'office-ui-fabric-react/lib/Styling';
import { initializeIcons } from '@uifabric/icons';
import { JFormData } from '../objects/JFormData';
import { FontClassNames } from '@uifabric/styling';
import * as PropTypes from 'prop-types';
import { autobind, BaseComponent, getNativeProps, divProperties } from 'office-ui-fabric-react/lib/Utilities';
import '../styles/main.css';
import { IFormState, IFormProps, IFormContext, IFormValidationResult } from './Form.types';
import { TranslatedProperty, ValidatorTypes } from '../Enums';
import { GenericFormInput } from '../formBaseInput/FormBaseInput';
import { Control } from '../objects/Control';
import { Row } from '../objects/Row';
import { addLocaleData } from 'react-intl';
import './polyfills.js';
import Rendering from './Rendering';

global.Intl = require('intl');

let frLocaleData = require('react-intl/locale-data/fr');
let deLocaleData = require('react-intl/locale-data/de');
let enLocaleData = require('react-intl/locale-data/en');
addLocaleData(frLocaleData);
addLocaleData(deLocaleData);
addLocaleData(enLocaleData);

initializeIcons();

export var FormLanguage = "";

/**
 * The main Form Control that renders the Control Tree
 */
export class Form extends BaseComponent<IFormProps, IFormState> {

  /**
   * This is needed because React 15's context does not work well with typescript
   */
  public static childContextTypes: React.ValidationMap<IFormContext> = {
    isFormValid: PropTypes.func.isRequired,
    mountInput: PropTypes.func.isRequired,
    unmountInput: PropTypes.func.isRequired,
    submitValue: PropTypes.func.isRequired,
  };

  /**
   * The Form Rendering Engine.
   */
  private _rendering:Rendering;

  /**
   The Converted jsonFormData as Object Model to render it.
   */
  public formData:JFormData

  /**
   * All registered inputs the form is aware of
   */
  private _mountedInputs: GenericFormInput[];

  /** 
   * Flag which marks whether or not the form has attempted to have been submitted 
   */
  private _pristine: boolean;

  /** 
   * Load the correct langauge, UI Fabric theme and the rendering engine.
   */
  constructor(props: IFormProps) {
    super(props);
    if (this.props.Language) {
      FormLanguage = this.props.Language;
    }

    this._rendering = new Rendering(() => ObjectFabric.getJsonFromForm(this.formData),  
      props.customControls, 
      props.customValidators, 
      props.customActions,  
      props.dataBinders,
      props.onCancelForm);
    this.formData = ObjectFabric.getForm(props.jsonFormData);

    this._mountedInputs = [];
    this._pristine = true;
    this.state = {
      validationResults: {}
    };

    if (this.formData.Theme) {
      loadTheme({
        palette: {
          'themePrimary': this.formData.Theme
         }
      });
    }
  }

  /** 
   * Call the formDidMount event and take over the mounted controls
   */  
  componentDidMount() {
    if (this.props.formDidMount) {
      this.props.formDidMount(this._mountedInputs);
    }
  }

  public render(): JSX.Element {
    let nativeProps = getNativeProps(this.props, divProperties);
    return (
      <form {...nativeProps} onSubmit={ this._onSubmit } key={this.formData.ID } >
      <div className="Form" key={this.formData.ID + "div1" }>
        { TranslatedProperty.Title && (
          <header className={ [
              "Form-header",
              FontClassNames.medium ].join(' ') } key={this.formData.ID + "heder" }>
            <h1 key={this.formData.ID + "h1" } >{ Helper.getTranslatedProperty(TranslatedProperty.Title, this.formData) }</h1>
          </header>
        ) }                
        <div className='Form-content' key={this.formData.ID + "Container" }>
          { this._rendering.buildRowWlements(this.formData.ID + "/R", this.formData.Rows) }
        </div>
      </div>
    </form>
    );
  }

  /**
   * Get the context for child components to use
   */
  public getChildContext(): IFormContext {
    return {
      isFormValid: this._isFormValid,
      mountInput: this._mountInput,
      unmountInput: this._unmountInput,
      submitValue: this._submitValue
    };
  }
    
  /**
   * Finde with the full control id the Control in the tree.
   * @param inputKey The full control id to finde the corresponding control
   */
  private _findeControlFromKey(inputKey:string): Control {
      let control:Control | undefined;
      let controlStruct = inputKey.split(".");

      if (this.formData.Rows)
        control = this._findeControlInRow(this.formData.Rows, controlStruct, 1);
      return control;
  }

  /**
   * Validate an individual input and set its error state
   * Returns the validation result
   * @param input The input to validate
   * @param showValidation Set to true if the error message shoul be set
   */
  private _validateComponent(input: GenericFormInput, showValidation?: boolean): IFormValidationResult {    
    if (!input.doValidate && input.props.validators) {
      let control:Control | undefined = this._findeControlFromKey(input.props.inputKey);
      if (control && control.FormValidators.find(v => v.ValidatorType == ValidatorTypes.Required)) {
        return {
          isValid: false,
          component: input,
        }
      }
    }
    else if (input.doValidate) {
      let validationResult = input.doValidate();
      if (showValidation && !validationResult.isValid)
        input.setError(validationResult.errorMessage);
      else if (!validationResult.isValid && (this.props.showErrorsWhenPristine || !this._pristine)) {
        input.setError(validationResult.errorMessage);
      } else {
        input.clearError();
      }
      return validationResult;      
    }
    return {
        isValid: true,
        component: input,
    }
  }

  /**
   * Validate all the individual inputs and set their error state
   * Returns a list of the validation results
   */
  private _validateForm(): { [key: string]: IFormValidationResult } {
    let validationResults: { [key: string]: IFormValidationResult } = {};
    this._mountedInputs.forEach((input: GenericFormInput) => {
      validationResults[input.props.inputKey] = this._validateComponent(input);
    });

    this.setState((prevState: IFormState) => {
      prevState.validationResults = validationResults;
      return prevState;
    });

    return validationResults;
  }

  /**
   * When the form is submitted. This will validate the form and call the appropriate submit callback
   * @param event The form event
   */
  @autobind
  private _onSubmit(event: React.FormEvent<HTMLElement>): void {
    event.preventDefault();
    if (this._pristine) {
      this._pristine = false;
    }

    let validationResults = this._validateForm();
    let formIsValid: boolean = this._isFormValid(validationResults);

    let jsonData = ObjectFabric.getJsonFromForm(this.formData);
    if (formIsValid && this.props.onSubmitForm) {
      this.props.onSubmitForm(jsonData);
    } else if (this.props.onInvalidSubmitForm) {
      this.props.onInvalidSubmitForm(jsonData)
    }
  }

  /**
   * Find the Control with the ID in the tree of controls
   * @param rows Row Array 
   * @param controlStruct ID Structure. the Element 0 is the id from the form an will not be used
   * @param level The level in where to search in the contrlStruct.
   */
  private _findeControlInRow(rows:Row[], controlStruct:string[], level:number): Control | undefined {
    for(let row of rows) {
      for(let col of row.Columns) {
        let control = this._findeControlInControls(col.Controls, controlStruct, level);
        if (control) return control;
      }
    }
    return undefined;
  }

  /**
   * Find the Control with the ID in the tree of controls
   * @param controls Control Array 
   * @param controlStruct ID Structure. the Element 0 is the id from the form an will not be used
   * @param level The level in where to search in the contrlStruct.
   */
  private _findeControlInControls(controls:Control[], controlStruct:string[], level:number): Control | undefined {
    let id = Helper.cleanUpKey(controlStruct[level]);
    let control = controls.find(c => c.ID == id);
    if (controlStruct.length-1 != level)
      if (control && control.SubRows)
        control = this._findeControlInRow(control.SubRows, controlStruct, level + 1);
      else if (control && control.SubControls)
        control =  this._findeControlInControls(control.SubControls, controlStruct, level + 1);
    return control;
  }

  /**
   * Register an input with the form
   * @param input The input to register
   */ 
  @autobind
  private _mountInput(input: GenericFormInput): void {
    let foundControl = this._mountedInputs.find(g => g.props.inputKey == input.props.inputKey);
    if (foundControl == undefined) {
      if (!input.doValidate)
      this._mountedInputs.push(input);
      this.setState((prevState: IFormState) => {
        prevState.validationResults[input.props.inputKey] = this._validateComponent(input);
        return prevState;
      });
    }
    else if (input.doValidate && !foundControl.doValidate) {
      this._unmountInput(foundControl);
      this._mountInput(input)
    } 
  }

  /**
   * Set the validation result, if Valid the control Value and if defined call the onUpdated Method
   * @param input The input that has rais an update
   * @param validate True if the input should validated.
   */ 
  @autobind
  private _submitValue(input: GenericFormInput, validate?: boolean): void {
    let validationResult: IFormValidationResult = this._validateComponent(input, validate);
    this.setState((prevState: IFormState) => {
      prevState.validationResults[input.props.inputKey] = validationResult;
      return prevState;
    });

    if (validationResult.isValid) {
      let control:Control | undefined = this._findeControlFromKey(input.props.inputKey);
      if (control) {
          control.Value = input.state.currentValue;
      }
      if (this.props.onUpdated) {
        this.props.onUpdated(input.props.inputKey, input.state.currentValue);
      }
    }
  }

  /**
   * Unregister an input with the form
   * @param input The input to unregister
   */
  @autobind
  private _unmountInput(input: GenericFormInput): void {
    let currentIndex: number = this._mountedInputs.indexOf(input);
    if (currentIndex > -1) {
      this._mountedInputs.splice(currentIndex, 1);
      this.setState((prevState: IFormState) => {
        delete prevState.validationResults[input.props.inputKey];
        return prevState;
      });
    }
  }

  /**
   * Check if the form is valid. If all validations are ok then reutrn true.
   * @param validationResults All validation results from the control tree. 
   */
  @autobind
  private _isFormValid(validationResults: { [key: string]: IFormValidationResult } = this.state.validationResults): boolean {
    for (let key in validationResults) {
      if (!validationResults[key].isValid) {
        return false;
      }
    }
    return true;
  }
}