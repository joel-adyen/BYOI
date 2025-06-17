const http = require('http');
const https = require('https');
const { parse } = require('querystring');
const fs = require('fs');
const path = require('path');
const dotenv = require("dotenv");
const url = require('url');

const { Client, CheckoutAPI, Config, Types} = require("@adyen/api-library");

// ===== Create the HTTP server =======================
const server = http.createServer((req, res) => {

  // console.log(`Request for: ${req.url}`);
  
  const parsedUrl = url.parse(req.url, true);


  if (parsedUrl.pathname === '/') {
    const query = parsedUrl.query;
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
      if (err) {
        console.error('Error loading index.html:', err);
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } 

  else if (req.url === '/script.js') {
    fs.readFile(path.join(__dirname, 'script.js'), 'utf8', (err, data) => {
      if (err) {
        console.error('Error loading script.js:', err);
        res.writeHead(404);
        return res.end('JS file not found');
      }
      res.writeHead(200, { 'Content-Type': 'text/js' });
      res.end(data);
    });
  } 

  else if (req.url === '/styles.css') {
    fs.readFile(path.join(__dirname, 'styles.css'), 'utf8', (err, data) => {
      if (err) {
        console.error('Error loading styles.css:', err);
        res.writeHead(404);
        return res.end('CSS file not found');
      }
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(data);
    });
  } 

  else if (req.method === 'POST' && req.url === '/sessions') {
    console.log("Sessions call for the server!!")

    let body = '';

    // Listen for data as it's received
    req.on('data', chunk => {
      body += chunk;
    });

    // Once all data has been received
    req.on('end', () => {
      try {
        req.body = body
        handleCreateSession(req, res);
      } catch (error) {
        console.log("Error with handleCreateSession: " + error)
      }
    });

  } 

  else if (req.method === 'POST' && req.url === '/advanced') {
    console.log("Advanced call for the server!!")

    let body = '';

    // Listen for data as it's received
    req.on('data', chunk => {
      body += chunk;
    });

    // Once all data has been received
    req.on('end', () => {
      try {
        req.body = body
        handleCreateAdvanced(req, res);
      } catch (error) {
        console.log("Error with handleCreateAdvanced: " + error)
      }
    });
  }

  else if (req.method === 'POST' && req.url === '/payment') {
    console.log("Payment call from client to the server!!")

    let body = '';

    // Listen for data as it's received
    req.on('data', chunk => {
      body += chunk;
    });

    // Once all data has been received
    req.on('end', () => {
      try {
        req.body = body
        handleAdvancedPayment(req, res);
      } catch (error) {
        console.log("Error with handleCreateAdvanced: " + error)
      }
    });
  }

  else if (req.method === 'POST' && req.url === '/paymentDetails') {
    console.log("Payment Details call from client to the server!!")

    let body = '';

    // Listen for data as it's received
    req.on('data', chunk => {
      body += chunk;
    });

    // Once all data has been received
    req.on('end', () => {
      try {
        req.body = body
        handlePaymentDetails(req, res);
      } catch (error) {
        console.log("Error with handleCreateAdvanced: " + error)
      }
    });
  }

  else {
    console.log(`404 - File not found: ${req.url}`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
})
// ----------------


function handleCreateSession(req, res) {

  // ===== ADYEN CHECKOUT =======================

  // Adyen library configuration
  const config = new Config();
  config.apiKey = process.env.ADYEN_API_KEY;
  config.liveEndpointUrlPrefix = process.env.LIVE_ENDPOINT_URL_PREFIX;
  config.environment = "LIVE";

  const client = new Client( config );
  const checkout = new CheckoutAPI(client);

  // ===== ADYEN SESSIONS CALL =======================

  const idempotencyKey = new Date().valueOf();
  const requestOptions = { idempotencyKey: idempotencyKey };

  // Create the request object(s)  
  const amount = JSON.parse(req.body);
  Types.checkout.Amount = amount;

  const createCheckoutSessionRequest = {
    reference: idempotencyKey,
    amount: amount,
    merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,

// No. 78/9, Wework vaishnavi signature, Outer Ring Rd, hobli, Bellandur, Varthur, Bengaluru, Karnataka 560103, India
    countryCode: "IN",
    billingAddress: {
      city: "Bengaluru",
      country: "IN",
      houseNumberOrName: "Wework vaishnavi signature",
      postalCode: "560103",
      street: "No. 78/9 Outer Ring Rd",
      stateOrProvince: "Karnataka"
    },
    deliveryAddress: {
      city: "Bengaluru",
      country: "IN",
      houseNumberOrName: "Wework vaishnavi signature",
      postalCode: "560103",
      street: "No. 78/9 Outer Ring Rd",
      stateOrProvince: "Karnataka"
    },
      shopperName: {
      firstName: "Buckaroo",
      lastName: "Banzai"
    },
    lineItems: [
      {
        quantity: "1",
        amountExcludingTax: amount.value,
        taxPercentage: "2100",
        description: "Shoes",
        id: "Item #1",
        taxAmount: "0",
        amountIncludingTax: amount.value,
        productUrl: "URL_TO_PURCHASED_ITEM",
        imageUrl: "URL_TO_PICTURE_OF_PURCHASED_ITEM"
      }
    ],
    returnUrl: `https://3000-joeladyen-byoi-0nozo67ibq0.ws-us120.gitpod.io/`
  };
  Types.checkout.CreateCheckoutSessionRequest = createCheckoutSessionRequest


  // Send the request
  const checkoutAPI = new CheckoutAPI(client);

  const response = checkoutAPI.PaymentsApi.sessions(createCheckoutSessionRequest)
    .then(response => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    })
    .catch(error => {
      console.error("Error with API call:", error);
    });

};


// ----------------

function handleCreateAdvanced(req, res) {

  // ===== ADYEN CHECKOUT =======================

  // Adyen library configuration
  const config = new Config();
  config.apiKey = process.env.ADYEN_API_KEY;
  config.liveEndpointUrlPrefix = process.env.LIVE_ENDPOINT_URL_PREFIX;
  config.environment = "LIVE";

  const client = new Client( config );
  const checkout = new CheckoutAPI(client);

  // ===== ADYEN PAYMENT METHODS CALL =======================

  const idempotencyKey = new Date().valueOf();

  // Create the request object(s)
  const amount = JSON.parse(req.body);
  Types.checkout.Amount = amount;

  const paymentMethodsRequest = {
    amount: amount,
    merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
    countryCode: "IN",
    // channel: Types.checkout.PaymentMethodsRequest.ChannelEnum.Web,
    shopperLocale: "en-IN"
    };
  // Types.checkout.PaymentMethodsRequest = PaymentMethodsRequest

  // Send the request
  const checkoutAPI = new CheckoutAPI(client);

  const response = checkoutAPI.PaymentsApi.paymentMethods(paymentMethodsRequest, { idempotencyKey: idempotencyKey })

    .then(response => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    })
    .catch(error => {
      console.error("Error with API call:", error);
    });
};



function handleAdvancedPayment(req, res) {
  console.log("Hello in handleAdvancedPayment")
  const idempotencyKey = new Date().valueOf();
  const config = new Config();
  config.apiKey = process.env.ADYEN_API_KEY;
  const client = new Client({ config });
  client.setEnvironment("LIVE", "8949b923f75af6b1-AdyenTechSupportIndia");

  const body = JSON.parse(req.body);
  const amount = body.amount
  Types.checkout.Amount = amount;

  const paymentRequest = {
    // authorisationType: "PreAuth",
    amount: amount,
    paymentMethod: body.state.paymentMethod,
    reference: idempotencyKey,
    merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
    countryCode: "IN",
    shopperLocale: "en-IN",
    returnUrl: `https://3000-joeladyen-byoi-0nozo67ibq0.ws-us120.gitpod.io/`,
    shopperName: {
      firstName: "Buckaroo",
      lastName: "Banzai"
    },

    shopperInteraction: "Ecommerce",
    recurringProcessingModel: "CardOnFile",
    storePaymentMethod: "true",
    shopperReference: idempotencyKey,

    shopperEmail: body.state.shopperEmail ? body.state.shopperEmail : "joel.schoolnik+1@adyen.com",
    telephoneNumber: body.state.telephoneNumber ? body.state.telephoneNumber : "+15103765679",
    billingAddress: body.state.billingAddress ? body.state.billingAddress : {
      city: "Bengaluru",
      country: "IN",
      houseNumberOrName: "Wework vaishnavi signature",
      postalCode: "560103",
      street: "No. 78/9 Outer Ring Rd",
      stateOrProvince: "Karnataka"

    },
    deliveryAddress: body.state.deliveryAddress ? body.state.deliveryAddress : {
      city: "Bengaluru",
      country: "IN",
      houseNumberOrName: "Wework vaishnavi signature",
      postalCode: "560103",
      street: "No. 78/9 Outer Ring Rd",
      stateOrProvince: "Karnataka"
    },
    lineItems: [
      {
        quantity: "1",
        amountExcludingTax: amount.value,
        taxPercentage: "0",
        description: "Shoes",
        id: "Item #1",
        taxAmount: "0",
        amountIncludingTax: amount.value,
        productUrl: "URL_TO_PURCHASED_ITEM",
        imageUrl: "URL_TO_PICTURE_OF_PURCHASED_ITEM"
      }
    ]
  };

console.log("paymentRequest body: ")
console.log(paymentRequest)


  // Send the /payments request
  const checkoutAPI = new CheckoutAPI(client);

  const response = checkoutAPI.PaymentsApi.payments(paymentRequest, { idempotencyKey: idempotencyKey })
  .then(response => {
    res.writeHead(200, { 'Content-Type': 'application/json' });

console.log("Payments response: ");
console.log(response);

    res.end(JSON.stringify(response));
  })
  .catch(error => {
    console.error("Error with API call:", error);
  });
}



function handlePaymentDetails(req, res) {
  console.log("Hello in handlePaymentDetails")

  const config = new Config();
  config.apiKey = process.env.ADYEN_API_KEY;
  const client = new Client({ config });
  client.setEnvironment("LIVE", "8949b923f75af6b1-AdyenTechSupportIndia");

  let body = JSON.parse(req.body);

  if(body.state.paymentData){
    body = body.state
  }

console.log("Payments Details request body: ")  
console.log(body)

  // Send the /paymentsDetails request
  const checkoutAPI = new CheckoutAPI(client);
  const response = checkoutAPI.PaymentsApi.paymentsDetails(body)
    .then(response => {
      res.writeHead(200, { 'Content-Type': 'application/json' });

console.log("Payments Details response: ");
console.log(response);

      res.end(JSON.stringify(response));
    })
    .catch(error => {
      console.error("Error with API call:", error);
    });
}




// ===== Start the server =======================

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at https://localhost:${PORT}/`);

  dotenv.config({
    path: "./.env",
  });

});
