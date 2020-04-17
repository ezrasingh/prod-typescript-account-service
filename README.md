# Accounts Service

> Microservice to handle user authentication and accounts.

## API

### Summary

- *`/api/auth`*
	- **`GET`** *`/refresh`* - Refresh Token
	- **`POST`** *`/login`* - Login a user
	- **`POST`** *`/register`* - Register a user
	- **`POST`** *`/change-password`* - Change user password
- *`/api/user`*
    - **`GET`** *`/me`* - Get current user info
    - **`GET`** *`/`* - Get all accounts
    - **`GET`** *`/:id`* - Get a single account
    - **`POST`** *`/`* - Create an account
    - **`PATCH`** *`/:id`* - Update an account
    - **`DELETE`** *`/:id`* - Delete an account
- *`/health`* - Healthcheck endpoint

## Development

> Requires a Postgres Database instance

Install application dependencies:

`npm install`

### Local Development

> You will need to provide your own Postges database and set the `TYPEORM_URL` in your [`.env`](template.env) file.

Run application in development mode locally

`npm start`

Run application in development mode locally in watch mode

`npm run start:dev`

### Dockerized Development

> You will need [Docker](https://www.docker.com/get-started) running on your machine.

Build container for development environment

`npm run docker:dev:build`

Run development environment

`npm run docker:dev`

Run only the development database (*enables **TTY***)

`npm run docker:dev:db`

## Testing

Run integration and unit test:

`npm run test`

Start test in watch mode:

`npm run test:watch`

## Linting

Run TSLint and Prettier to analyze source code

`npm run lint`

Run TSLint and Prettier to correct syntax issues

`npm run lint:fix`

### Running in Windows

Docker on windows utilizes a [local virtual machine](https://docs.docker.com/machine/get-started/) for networking, this can make accessing exposed ports difficult. First, start the virtual host then locate the host's IP address:

`docker-machine start`

`npm run docker:host`

Use the IP address from the previous step to access your dev environments Postgres database. Configure `TYPEORM_URL` environment variable with the following template:

`postgresql://db:development@<docker-machine-ip>:5001/app/development`

This is also the IP address used to access the service via the staging environment. Here is an example request with [curl](https://curl.haxx.se/docs/manpage.html):

`curl https://<docker-machine-ip>:8080/health`

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
