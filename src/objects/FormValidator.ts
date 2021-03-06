import { JsonObject, JsonProperty } from "json2typescript";
import { ValidatorTypes } from "../Enums";
import { ValidatorTypeConverter } from "./jsonConverters/ValidatorTypeConverter";
import { Translate, TransConverter } from "./jsonConverters/TransConverter";

/**
 * Form Validator Representation for an validator json object.
 */
@JsonObject
export class FormValidator {
    @JsonProperty("message", String, true) 
    Message: string = "";

    @JsonProperty("validator_type", ValidatorTypeConverter) 
    ValidatorType:ValidatorTypes = ValidatorTypes.Required;  

    @JsonProperty("message_trans", TransConverter, true)
    MessageTranslates?: Translate[] = undefined;    
 
    @JsonProperty("value", Number, true) 
    Value: number = 0;

    @JsonProperty("regex", String, true) 
    Regex: string = "";
    
    @JsonProperty("custom_type", String, true) 
    CustomTypeName: string = "";
}