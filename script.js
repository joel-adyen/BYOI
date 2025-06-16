// script.js

// =========SESSIONS FLOW==========

function startSession() {

  // 1. Make a request to the server to get the session data

  const payload = getFormFields('frm1')

  fetch('/sessions', {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(response => response.json())
  .then(sessionData => {

    // 2. Once the session data is received, create the checkout instance

    const globalConfiguration = {
      session: {
        id: sessionData.id,
        sessionData: sessionData.sessionData
      },

      environment: 'live',
      locale: 'en-IN',
      countryCode: 'IN',
      originKey:  'pub.v2.ZNSLGS53H2P27QX3.aHR0cHM6Ly8zMDAwLWpvZWxhZHllbi1ieW9pLTBub3pvNjdpYnEwLndzLXVzMTIwLmdpdHBvZC5pbw.OmFcpqBJL6eeqeRhIP3UPbAqrN5HkjpUdgiV-AdprKk',
      clientKey: 'live_QGLCEPJPRVDQ7N5KUUG426B52ASWWXNZ',

      onPaymentCompleted: (result, component) => {
        showFlashMessage('success', 'Operation successful!') 
        console.info(result, component);
      },
      onPaymentFailed: (result, component) => {
        showFlashMessage('error', 'Operation failed...')
        console.info(result, component);
      },
      onError: (error, component) => {
        showFlashMessage('error', 'There was an error...')
        console.error(error.name, error.message, error.stack, component);
      }
    };  

    // 3. Create an AdyenCheckout instance with the session data

    const { AdyenCheckout, Dropin  } = window.AdyenWeb;

    AdyenCheckout(globalConfiguration)
      .then((checkout) => {
        try {
          const dropin = new Dropin(checkout, globalConfiguration).mount('#dropin-container');
        } catch (error) {
          console.error('Error creating dropin:', error);
        }
      });

  })

  .catch(error => {
    console.error('Error fetching session data:', error);
  });
};



// =========ADVANCED FLOW==========
function startAdvanced() {

  // 1. Make a request to the server to get the payment methods

  const payload = getFormFields('frm1')

  fetch('/advanced', {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  .then(response => response.json())
  .then(paymentMethodsResponse => {

  // 2. Once the payment method data is received, create the checkout instance

    const paypalConfiguration = {
      intent: "tokenize"
    };
    const cardConfiguration = {
      enableStoreDetails: true,
      hasHolderName: false, // Show the cardholder name field.
      holderNameRequired: false, // Mark the cardholder name field as required.
      billingAddressRequired: false // Show the billing address input fields and mark them as required.
    };

    const globalConfiguration = {

      environment: 'live',
      // locale: 'en-IN',
      countryCode: 'IN',
      originKey:  'pub.v2.ZNSLGS53H2P27QX3.aHR0cHM6Ly8zMDAwLWpvZWxhZHllbi1ieW9pLTBub3pvNjdpYnEwLndzLXVzMTIwLmdpdHBvZC5pbw.OmFcpqBJL6eeqeRhIP3UPbAqrN5HkjpUdgiV-AdprKk',
      clientKey: 'live_QGLCEPJPRVDQ7N5KUUG426B52ASWWXNZ',
      amount: payload,
      // showPayButton: false, // onSubmit is called when typing return in last field

      // The full /paymentMethods response object from the server.
      paymentMethodsResponse: paymentMethodsResponse,

      onSubmit: async (state, component, actions) => {
console.log(state)
        try {
          // Make a POST /payments request to server.
          const fullPayload = {
            state: state.data,
            amount: payload
          }
          const result =   fetch('/payment', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload),
          })
          .then(response => response.json())
          .then(res => handleServerResponse(res, component, actions));

        } catch (error) {
          console.error("onSubmit", error);
          actions.reject();
        }

      },




// THIS IS NOT LOADING BECAUSE THE startAdvanced FUNCTION IS LOST ON PAGE REFRESH (AFTER THE REDIRECT)
// THIS IS USED FOR PAYPAL AND OTHER METHODS
      onAdditionalDetails: async (state, component, actions) => {
        console.log("Hello inside onAdditionalDetails")
        console.log(state)
        try {
          // Make a POST /payments/details request to server.
          const fullPayload = {
            state: state.data
          }
          const result =   fetch('/paymentDetails', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload),
            }).then(response => response.json())

          .then(res => handleServerResponse(res, component, actions));

        } catch (error) {
          console.error("onSubmit", error);
          component.reject();
        }
      },


      onPaymentCompleted: (result, component) => {
        console.info(result, component);
      },
      onPaymentFailed: (result, component) => {
        console.info(result, component);
      },
      onError: (error, component) => {
        console.error(error.name, error.message, error.stack, component);
      }
    };


    // 3. Create an AdyenCheckout instance with the session data

    const { AdyenCheckout, Dropin  } = window.AdyenWeb;

    AdyenCheckout(globalConfiguration)
      .then((checkout) => {    
        try {
          const dropin = new Dropin(checkout, { paymentMethodsConfiguration: { paypal: paypalConfiguration, card: cardConfiguration } } ).mount('#dropin-container');
        } catch (error) {
          console.error('Error creating dropin:', error);
        }
      });

  })

  .catch(error => {
    console.error('Error fetching session data:', error);
  });
};



//=========HELPTER FUNCTIONS=======================//
function getFormFields (elementId) {
  const form = document.getElementById(elementId);
  return {
    currency: form.elements['currency'].value,
    value: form.elements['amount'].value.replace(/\./g, "")
  }
}


function handleServerResponse(res, component, actions) {

console.log("handleServerResponse: res")
console.log(res)

  if (res.action) {
    const {
      resultCode,
      action,
      order,
      donationToken
    } = res;

    actions.resolve({
      resultCode,
      action,
      order,
      donationToken
    });
    
  } else {
    switch (res.resultCode) {
      case "Authorised":
        window.location.href = "/";
        showFlashMessage('success', 'Operation successful!')
        break;
      case "Pending":
      case "Received":
        window.location.href = "/";
        showFlashMessage('success', 'Operation Pending/Received')
        // Insert flash message that the result is Pending / Received
        break;
      case "Refused":
        window.location.href = "/";
        showFlashMessage('error', 'Refused :( ')
        break;
      default:
        // Insert flash message that the result is is Error
        window.location.href = "/";
        showFlashMessage('error', 'An error occurred!')
        break;
    }
  }
}



// Call the function when the page loads or when you detect a redirect return
// This applies to both Sessions and Advanced flows
// window.onload = function() {

//   const urlParams = new URLSearchParams(window.location.search);
//   redirectResult = urlParams.get('redirectResult');

//   if (redirectResult) {
    
//     showFlashMessage('success', 'Operation successful!')  
//     console.log("This is redirectResult: " + redirectResult)

//     const payload = {
//       details: {
//         redirectResult: redirectResult
//       }
//     }

//     try {
//       // Make a POST /payments/details request to server.
//       const result =   fetch('/paymentDetails', {
//         method: 'POST',
//         mode: 'cors',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//         }).then(response => response.json())

//       /* handleServerResponse triggers everytime the window loads.  
//       For a redirect, the function will be call twice 
//       (once with the url parms, and then again when paymentDetails is called) */
//       .then(res => handleServerResponse(res));

//     } catch (error) {
//       console.error("onload", error);
//       component.reject();
//     }

//   }

// };



// Show flash message on outcome of payment
function showFlashMessage(type, message) {
    const container = document.getElementById('flash-message-container');
    const flashMessage = document.createElement('div');
    flashMessage.classList.add('flash-message', type);
    flashMessage.textContent = message;
    container.appendChild(flashMessage);

    setTimeout(() => {
        flashMessage.classList.add('show');
    }, 10);

    setTimeout(() => {
        flashMessage.classList.remove('show');
        setTimeout(() => {
            flashMessage.remove();
        }, 500);
    }, 3000);
}


