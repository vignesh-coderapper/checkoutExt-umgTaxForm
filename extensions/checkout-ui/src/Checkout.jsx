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
} from "@shopify/ui-extensions-react/checkout";
import { BlockSpacer, Button, Form, Grid, GridItem, Heading, Select, TextField, View } from "@shopify/ui-extensions/checkout";
import { useEffect, useState } from "react";
import taxFormJson from '../json/regimes.json';
import postalData from '../json/postalCode.json';

// 1. Choose an extension target
export default reactExtension("purchase.checkout.actions.render-before", () => (
  <Extension />
));

function Extension() {

  // const taxFormJson = {
  //   "regimes": [
  //     {
  //       "person":"natural_person",
  //       "regime": "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "606 - Arrendamiento"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "607 - Régimen de Enajenación o Adquisición de Bienes"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "608 - Demás ingreso"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "610 - Residentes en el Extranjero sin Establecimiento Permanente en México"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "611 - Ingresos por Dividendos (socios y accionistas)"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "612 - Personas Físicas con Actividades Empresariales y Profesionales"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "614 - Ingresos por intereses"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "615 - Régimen de los ingresos por obtención de premios"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "616 - Sin obligaciones fiscales"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "621 - Incorporación Fiscal"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas"
  //     },
  //     {
  //       "person":"natural_person",
  //       "regime": "626 - Régimen Simplificado de Confianza"
  //     },
  //     {
  //       "person":"legal_entity",
  //       "regime": "601 - General de Ley Personas Morales"
  //     },
  //     {
  //       "person":"legal_entity",
  //       "regime": "603 - Personas Morales con Fines no Lucrativos"
  //     },
  //     {
  //       "person":"legal_entity",
  //       "regime": "610 - Residentes en el Extranjero sin Establecimiento Permanente en México"
  //     },
  //     {
  //       "person":"legal_entity",
  //       "regime": "620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos"
  //     }
  //   ],
  //   "cfdis": [
  //     {
  //       "person":"natural_person",
  //       "cfdi": "G01 - Adquisicion de Mercancias"
  //     },
  //     {
  //       "person":"natural_person",
  //       "cfdi": "G02 - Devoluciones, Descuentos, o Bonificaciones"
  //     },
  //     {
  //       "person":"natural_person",
  //       "cfdi": "S01 - Sin Efectos Fiscales"
  //     },
  //     {
  //       "person":"legal_entity",
  //       "cfdi": "G01 - Adquisicion de Mercancias"
  //     },
  //     {
  //       "person":"legal_entity",
  //       "cfdi": "G02 - Devoluciones, Descuentos, o Bonificaciones"
  //     },
  //     {
  //       "person":"legal_entity",
  //       "cfdi": "S01 - Sin Efectos Fiscales"
  //     }
  //   ]
  // }

  
  const translate = useTranslate();
  const [checked, setChecked] = useState(false);
  const [regimeOptions, setRegimeOptions] = useState([])
  const [cfdiOptions, setCfdiOptions] = useState([])
  // const [selectedOption, setSelectedOption] = useState([])
  const { extension } = useApi();
  const formValueObj = {
    name: '',
    type: '',
    rfc: '',
    postalCode: '',
    taxRegime: '',
    useCfdi: ''
  }
  const [formValues, setFormValues] = useState(formValueObj);
  const [validation, setValidation] = useState(formValueObj);

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

  const handleChange = (field, value) => {
    if (field === 'name') {
      const isValid = value.length > 4 && /^[a-zA-ZÀ-ÿ' -]+$/.test(value)
      console.log('formValues.taxRegime && formValues.useCfdi', isValid)
      setFormValues((prev) => ({ ...prev, [field]: value }));
      setValidation((prev) => {
        if(formValues.taxRegime.length === 0 && formValues.useCfdi.length === 0) {
          return { ...prev,[field]: !isValid ? 'Name is Not Valid' : '', taxRegime:'Regimee Not Valid', useCfdi: 'Cfdi is not valid'} 
        } 
        return { ...prev, [field]: !isValid ? 'Name is Not Valid' : '' }
      });
    } else if (field === 'type') {
      const regimeArr = [];
      const cfdiArr = [];

      taxFormJson.regimes.forEach((item) => {
        if (item.person === value) {
          regimeArr.push({
            value: item.regime,
            label: item.regime,
          });
        }
      });

      taxFormJson.cfdis.forEach((item) => {
        if (item.person === value) {
          cfdiArr.push({
            value: item.cfdi,
            label: item.cfdi,
          });
        }
      });

      setRegimeOptions(regimeArr)
      setCfdiOptions(cfdiArr)
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
      setValidation((prev) => ({ ...prev, [field]: !value.length ? 'Type is required' : '' }));

      validateRFC('rfc', formValues.rfc, value)
    } else if (field === 'postalCode') {
      const isPostalValid = postalData.postal_codes.find(i => i === value )
      if (isPostalValid) {
        setFormValues((prev) => ({ ...prev, [field]: value }));
        setValidation((prev) => ({ ...prev, [field]: '' }));
      } else {
        setValidation((prev) => ({ ...prev, [field]: 'Postal is not Valid' }));
      }
    } else if (field === 'rfc') {
      validateRFC(field, value, formValues.type)
    } else if (field === 'taxRegime') {
      setFormValues((prev) => ({ ...prev, [field]: value }));
      setValidation((prev) => ({ ...prev, [field]: !value.length ? 'Regime not valid' : ''  }));
    } else if (field === 'useCfdi') {
      setFormValues((prev) => ({ ...prev, [field]: value }));
      setValidation((prev) => ({ ...prev, [field]: !value.length ? 'Regime not valid' : ''  }));
    }
     else {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    }
  };


  const handleSubmit = async () => {
    console.log('handle submit')
  
    // const attributes = [
    //   { key: 'Name', value: formValues.name },
    //   { key: 'EntityType', value: formValues.type },
    //   { key: 'RFC', value: formValues.rfc },
    //   { key: 'PostalCode', value: formValues.postalCode },
    //   { key: 'TaxRegime', value: formValues.taxRegime },
    //   { key: 'UseCFDI', value: formValues.useCfdi },
    // ];

    
    try {
      const result = await applyAttributeChange({
        key: "invoiceTaxForm",
        type: "updateAttribute",
        value: JSON.stringify(formValues),
      });
      console.log('Cart attributes updated successfully', result);
    } catch (error) {
      console.error('Error updating cart attributes:', error);
    }
  };

  const checkboxHandler = () => {
    console.log('checkboxhandler')
    setChecked(!checked)
    const newValidation = {...validation}

    if (!formValues.name) newValidation.name = "Name is required";
    if (!formValues.type) newValidation.type = "Type is required";
    if (!formValues.rfc) newValidation.rfc = "RFC is required";
    if (!formValues.postalCode) newValidation.postalCode = "Postal Code is required";
    if (!formValues.taxRegime) newValidation.taxRegime = "Tax Regime is required";
    if (!formValues.useCfdi) newValidation.useCfdi = "CFDI is required";

    setValidation(newValidation);
  }


  useEffect(() => {
    const isFormValid =
      !validation.name &&
      !validation.type &&
      !validation.rfc &&
      !validation.postalCode &&
      !validation.taxRegime &&
      !validation.useCfdi;
    
    if(isFormValid) {
      handleSubmit()
    }
  }, [validation])

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
          {console.log('formValues', formValues)}
          {console.log('validation', validation)}
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
                  error={(formValues.type.length && validation.type)? validation.type : ''}
                />
              </View>
              <View>
                <TextField
                  label={translate('rfc')}
                  value={formValues.rfc}
                  onChange={(value) => handleChange('rfc', value)}
                  error={formValues.rfc.length && validation.rfc? validation.rfc : ''}
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
            {/* <BlockSpacer spacing="base" /> */}
            {/* <Button accessibilityRole="submit">
              Submit
            </Button> */}
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