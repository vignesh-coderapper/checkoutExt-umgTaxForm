import { Select } from '@shopify/ui-extensions/checkout';
import React from 'react';

const InvoiceForm = () => {
  return (
    <Form
      onSubmit={() =>
        console.log('onSubmit event')
      }
    >
      <Grid
        columns={['50%', '50%']}
        spacing="base"
      >
        <View>
          <TextField label="Name or Social reason" />
        </View>
        <View>
          <Select
            label="Kind of person"
            value="Kind of person"
            options={[
              {
                value: 'Im a natural person',
                label: 'Im a natural person',
              },
              {
                value: 'Im a legal entity',
                label: 'Im a legal entity',
              },
            ]}
          />
        </View>
        <View>
          <TextField label="RFC" />
        </View>
        <View>
          <TextField label="Postal code" />
        </View>
        <View>
          <Select
            label="Tax Regime"
            value="2"
            options={[
              {
                value: 'Im a natural person',
                label: 'Im a natural person',
              },
              {
                value: 'Im a legal entity',
                label: 'Im a legal entity',
              },
            ]}
          />
        </View>
        <View>
          <Select
            label="Use CFDI"
            value="Use CFDI"
            options={[
              {
                value: 'Im a natural person',
                label: 'Im a natural person',
              },
              {
                value: 'Im a legal entity',
                label: 'Im a legal entity',
              },
            ]}
          />
        </View>
        <GridItem columnSpan={2}>
          <TextField label="Company" />
        </GridItem>
      </Grid>
      <BlockSpacer spacing="base" />
      <Button accessibilityRole="submit">
        Submit
      </Button>
    </Form>
  )
};

export default InvoiceForm;