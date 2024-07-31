import {
  reactExtension,
  Banner,
  BlockStack,
  Checkbox,
  Text,
  useApi,
  useApplyAttributeChange,
  useInstructions,
  useTranslate,
  useApplyCartLinesChange,
  useBuyerJourneyIntercept,
  useExtensionCapability,
} from "@shopify/ui-extensions-react/checkout";
import { BlockSpacer, Button, Form, Grid, GridItem, Heading, Select, TextField, View } from "@shopify/ui-extensions/checkout";
import { useCallback, useEffect, useState } from "react";
import taxFormJson from '../json/regimes.json';
import postalData from '../json/postalCode.json';

// 1. Choose an extension target
export default reactExtension("purchase.checkout.delivery-address.render-after", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();
  const [checked, setChecked] = useState(false);
  const [isSubmitted, setSubmitted] = useState(false);
  const [regimeOptions, setRegimeOptions] = useState([])
  const [cfdiOptions, setCfdiOptions] = useState([])
  // const [selectedOption, setSelectedOption] = useState([])
  const { extension } = useApi();
  const initialFormState = {
    name: '',
    type: '',
    rfc: '',
    postalCode: '',
    taxRegime: '',
    useCfdi: ''
  }


  const [formValues, setFormValues] = useState(initialFormState);
  const [validation, setValidation] = useState(initialFormState);

  const instructions = useInstructions();
  const applyAttributeChange = useApplyAttributeChange();

  // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
  if (!instructions.attributes.canUpdateAttributes) {
    // For checkouts such as draft order invoices, cart attributes may not be allowed
    // Consider rendering a fallback UI or nothing at all, if the feature is unavailable
    return (
      <Banner title="tax form" status="warning">
        {translate("attributeChangesAreNotSupported")}
      </Banner>
    );
  }

  const isValidDate = (dateString) => {
    const year = parseInt(dateString.slice(0, 2), 10);
    const month = parseInt(dateString.slice(2, 4), 10);
    const day = parseInt(dateString.slice(4, 6), 10);

    if (month < 1 || month > 12) {
      return false;
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    return day > 0 && day <= daysInMonth;
  };

  const validateRFC = (field, rfc, entityType) => {
    let length, letterPart, datePart, alphanumericPart;

    if (entityType === 'natural_person') {
      length = 13;
      if (rfc.length >= 10) {
        letterPart = rfc.slice(0, 4);
        datePart = rfc.slice(4, 10);
        alphanumericPart = rfc.slice(10, 13);
      }
    } else if (entityType === 'legal_entity') {
      length = 12;
      if (rfc.length >= 9) {
        letterPart = rfc.slice(0, 3);
        datePart = rfc.slice(3, 9);
        alphanumericPart = rfc.slice(9, 12);
      }
    }

    const isLengthValid = rfc.length === length;
    const isLetterPartValid = letterPart ? /^[A-ZÑ&]+$/.test(letterPart) : false;
    const isDatePartValid = datePart ? /^\d{6}$/.test(datePart) && isValidDate(datePart) : false;
    const isAlphanumericPartValid = alphanumericPart ? /^[A-Z0-9]+$/.test(alphanumericPart) : false;
    setFormValues((prev) => ({ ...prev, [field]: rfc }));

    if (isLengthValid && isLetterPartValid && isDatePartValid && isAlphanumericPartValid) {
      setValidation((prev) => ({ ...prev, [field]: '' }));
    } else {
      // setTimeout(() => {
      //   setFormValues((prev) => ({ ...prev, ['rfc']: '' }));
      // }, 1000);
      setValidation((prev) => ({ ...prev, [field]: 'RFC is Not Valid' }));
    }
  };

  const validataName = (field, value) => {
    const isValid = value.length > 4 && /^[a-zA-ZÀ-ÿ' -]+$/.test(value)
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setValidation((prev) => {
      if(formValues.taxRegime.length === 0 && formValues.useCfdi.length === 0 && formValues.type.length === 0) {
        return { ...prev,[field]: !isValid ? 'Name is Not Valid' : '', type:'Select the Entity', taxRegime:'Regimee Not Valid', useCfdi: 'Cfdi is not valid'} 
      } 
      return { ...prev, [field]: !isValid ? 'Name is Not Valid' : '' }
    });
  }

  const validateEntity = (field, value) => {
    const regimeArr = [];
    taxFormJson.regimes.forEach((item) => {
      if (item.person === value) {
        regimeArr.push({
          value: item.regime,
          label: item.regime,
        });
      }
    });
    setRegimeOptions(regimeArr)
    // setFormValues((prev) => ({
    //   ...prev,
    //   [field]: value,
    //   rfc: ''
    // }));
    setFormValues((prev) => {
      const newFormValues = {
        ...prev,
        [field]: value,
        rfc: '', // Ensure rfc is set to an empty string
      };
  
      // Validate RFC with the updated form values
      validateRFC('rfc', newFormValues.rfc, value);
      return newFormValues;
    });
    setValidation((prev) => ({ ...prev, [field]: !value.length ? 'Type is required' : '' }));
  }

  const validatePostal = (field, value) => {
    const isPostalValid = postalData.postal_codes.find(i => i === value )
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (value && isPostalValid) {
      setValidation((prev) => ({ ...prev, [field]: '' }));
    } else {
      setValidation((prev) => ({ ...prev, [field]: 'Postal is not Valid' }));
    }
  }

  const validateSelectDropdown = (field, value, Errormessage) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setValidation((prev) => ({ ...prev, [field]: !value.length ? Errormessage : ''  }));
  }

  

  const handleChange = (field, value) => {
    if (field === 'name') {
      validataName(field, value)
    } else if (field === 'type') {
      validateEntity(field, value)
    } else if (field === 'postalCode') {
      validatePostal(field, value)
    } else if (field === 'rfc') {
      validateRFC(field, value, formValues.type)
    } else if (field === 'taxRegime') {
      validateSelectDropdown(field, value, 'Regime not valid');
    } else if (field === 'useCfdi') {
      validateSelectDropdown(field, value, 'CFDI not valid');
    }
  };


  // const handleSubmit = async () => {
  //   try {
  //     const result = await applyAttributeChange({
  //       key: "invoiceTaxForm",
  //       type: "updateAttribute",
  //       value: JSON.stringify(formValues),
  //     });
  //     // setChecked(false)
  //     // if(result) {
  //     //   setSuccess(true)
  //     // }
  //     console.log('Cart attributes updated successfully', result);
  //   } catch (error) {
  //     console.error('Error updating cart attributes:', error);
  //   }
  // };


  const handleSubmit = async () => {
    try {
      const result = await applyAttributeChange({
        key: "invoiceTaxForm",
        type: "updateAttribute",
        value: JSON.stringify(formValues),
      });

      console.log("Cart attributes updated successfully", result);
      if(result) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error("Error updating cart attributes:", error);
    }
  };

  const checkboxHandler = () => {
    setChecked((prevChecked) => {
      const newChecked = !prevChecked;
      if (!newChecked) {
        setFormValues(initialFormState); // Reset form values if checkbox is unchecked
        setValidation(initialFormState); // Reset validation
      }
      return newChecked;
    });
  }

  // const validateFormValueEmpty = () => {
  //   const newValidation = { ...validation };
  //   if (!formValues.name) newValidation.name = "Name is required";
  //   if (!formValues.type) newValidation.type = "Type is required";
  //   if (!formValues.rfc) newValidation.rfc = "RFC is required";
  //   if (!formValues.postalCode) newValidation.postalCode = "Postal Code is required";
  //   if (!formValues.taxRegime) newValidation.taxRegime = "Tax Regime is required";
  //   if (!formValues.useCfdi) newValidation.useCfdi = "CFDI is required";
  //   setValidation(newValidation);
  // };


  // Integrate useBuyerJourneyIntercept for blocking progress based on form validation
  useBuyerJourneyIntercept(async () => {
    let isSent = false
    const hasEmptyField = Object.values(formValues).some(value => value.length === 0);
    const hasValidationErrors = Object.values(validation).some(value => value !== '');


    console.log({formValues})
    console.log({validation})
    console.log({hasEmptyField})
    console.log({hasValidationErrors})
    
    // if (checked && isFormValid ) {
    //   // const allValuesAreEmpty = areAllValuesEmpty(validation)
    //   console.log('FIRST level validation')

    //     return {
    //       behavior: "block",
    //       reason: "Form validation failed",
    //       perform: () => {
    //         // Ensure any validation errors are shown
    //         validateFormValueEmpty();
    //       },
    //     };
      
    // }

    if((checked && hasEmptyField) || (checked && hasValidationErrors)) {
      console.log('second level validation')
      return {
        behavior: "block",
        reason: "Form validation",
        perform: () => {
          // Ensure any validation errors are shown
          if (Object.keys(formValues).length) {
            Object.entries(formValues).forEach(([key, value]) => {
              handleChange(key, value)
            });
          }
        },
      };
    }

    if (!hasEmptyField && !hasValidationErrors && !isSent) {
      console.log('Form validation successful - proceeding to submit');
        handleSubmit();
        isSent = true
  
      return {
        behavior: 'block',
        reason: 'Form validation successful',
        perform: () => {
          console.log('Form submitted successfully');
        },
      };
    }

    return {
      behavior: 'allow',
    };
  });

  useEffect( () => {

    setCfdiOptions(
      taxFormJson.cfdis.map(item => ({
        value: item.cfdi,
        label: item.cfdi
      }))
    );
    
  }, [])

  // 3. Render a UI
  return (
    <BlockStack>
      <Checkbox id="checkbox" name="checkbox" onChange={checkboxHandler}>
        {translate('clickHereIfYouRequireAnInvoice')}
      </Checkbox>
      {checked && (
        <BlockStack>
          <Heading level={1}>{translate('taxInformationForYourInvoice')}</Heading>
          <Heading level={3}>{translate('pleaseVerifyBodyCopy')}</Heading>
          {/* {console.log('formValues', formValues)} */}
          {/* {console.log('validation', validation)} */}
          <Form>
            <Grid columns={['50%', '50%']} spacing="base">
              <View>
                <TextField
                  label={translate('nameOrSocialReason')}
                  value={formValues.name}
                  onChange={(value) => handleChange('name', value)}
                  error={(validation.name)? validation.name : ''}
                />
              </View>
              <View>
                <Select
                  label={translate('kindOfPerson')}
                  value={formValues.type}
                  onChange={(value) => handleChange('type', value)}
                  options={[
                    { value: 'natural_person', label: 'Im a natural person' },
                    { value: 'legal_entity', label: 'Im a legal entity' },
                  ]}
                  error={(validation.type)? validation.type : ''}
                />
              </View>
              <View>
                <TextField
                  label={translate('rfc')}
                  value={formValues.rfc}
                  onChange={(value) => handleChange('rfc', value)}
                  error={validation.rfc? validation.rfc : ''}
                />
              </View>
              <View>
                <TextField
                  label={translate('postalCode')}
                  value={formValues.postalCode}
                  onChange={(value) => handleChange('postalCode', value)}
                  error={validation.postalCode? validation.postalCode : ''}
                />
              </View>
              <View>
                <Select
                  label={translate('taxRegime')}
                  value={formValues.taxRegime}
                  onChange={(value) => handleChange('taxRegime', value)}
                  options={regimeOptions}
                  error={validation.taxRegime? validation.taxRegime : ''}
                />
              </View>
              <View>
                <Select
                  label={translate('useCfdi')}
                  value={formValues.useCfdi}
                  onChange={(value) => handleChange('useCfdi', value)}
                  options={cfdiOptions}
                  error={validation.useCfdi? validation.useCfdi : ''}
                />
              </View>
            </Grid>
          </Form>
        </BlockStack>
      )}
    </BlockStack>
  );

  async function onCheckboxChange(isChecked) {
    // 4. Call the API to modify checkout
    const result = await applyAttributeChange({
      key: "invoiceTax",
      type: "updateAttribute",
      value: isChecked ? "yes" : "no",
    });
    
    console.log("applyAttributeChange result", result);
  }
}