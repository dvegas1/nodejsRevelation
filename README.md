# Node.js express.js MongoDB JWT REST API

## Features

-   Multiple environment ready (development, production)
-   Custom email/password user system with basic security and blocking for preventing brute force attacks.
-   Compressed responses.
-   Secured HTTP headers.
-   CORS ready.
-   Cache ready (Redis).
-   HTTP request logger in development mode.
-   i18n ready (for sending emails in multiple languages).
-   User roles.
-   Pagination ready.
-   User profile.
-   Users list for admin area.
-   Login access log with IP, browser and country location (for country it looks for the header `cf-ipcountry` that CloudFlare creates when protecting your website).
-   API autogenerated documentation by Postman.
-   API collection example for Postman.
-   Testing with mocha/chai for API endpoints.
-   NPM scripts for cleaning and seeding the MongoDB database.
-   NPM script for keeping good source code formatting using prettier and ESLint.
-   Use of ESLint for good coding practices.
-   Mailer example with Nodemailer and Mailgun.
-   Ability to refresh token
-   Firebase cloud
-   JWT Tokens, make requests with a token after login with `Authorization` header with value `Bearer yourToken` where `yourToken` is the **signed and encrypted token** given in the response from the login process.

## Requirements

-   Node.js **10+**
-   MongoDB **3.6+**
-   Redis **5.0+**

### Install npm dependencies after installing (Git or manual download)

```bash
cd myproject
npm install
npm update
```

### Setting up environments (development or production)

1.  In the root this repository you will find a file named `.env.example`
2.  Create a new file by copying and pasting the file and then renaming it to just `.env`
3.  The file `.env` is already ignored, so you never commit your credentials.
4.  Change the values of the file to your environment (development or production)
5.  Upload the `.env` to your environment server(development or production)
6.  If you use the postman collection to try the endpoints, change value of the variable `server` on your environment to the url of your server, for development mode use <http://localhost:3001>

**IMPORTANT:** By default token expires in 3 days (4320 minutes set in .env.example). You can refresh token at endpoint GET /token. If everything it´s ok you will get a new token.

### Mailer

To ensure the deliverability of emails sent by this API, `Mailgun` is used for mailing users when they sign up, so if you want to use that feature go sign up at their website <https://www.mailgun.com>

If you want to try a different method it´s ok, I used <https://nodemailer.com> for this API and they have different transport methods like: smtp.

### i18n

Language is automatically detected from `Accept-Language` header on the request. So either you send locale manually on the request or your browser will send its default, if `Accept-Language` header is not sent then it will use `en` locale as default.

## How to run

### Database cleaning and seeding samples

There are 3 available commands for this: `fresh`, `clean` and `seed`.

```bash
npm run command
```

-   `fresh` cleans and then seeds the database with dynamic data.
-   `clean` cleans the database.
-   `seed` seeds the database with dynamic data.

### Running in development mode (lifting API server)

```bash
npm run dev
```

You will know server is running by checking the output of the command `npm run dev`

```bash
****************************
*    Starting Server
*    Port: 3001
*    NODE_ENV: development
*    Database: MongoDB
*    DB Connection: OK
****************************
```

### Running tests

It´s a good practice to do tests at your code, so a sample of how to do that in `mocha/chai` is also included in the `/test` directory

```bash
npm run test
```

### Formatting code

Format your code with prettier by typing:

```bash
npm run format
```

### Formatting markdown files

Format all your markdown files with remark by typing:

```bash
npm run remark
```

### Linting code

Lint your code with ESLint by typing:

```bash
npm run lint
```
