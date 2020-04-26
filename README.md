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

> You will need to provide your own Postges database and set the `DB_URL` in your [`.env`](template.env) file.

Run application in development mode locally:

`npm start`

Run application in development mode locally in watch mode:

`npm run start:dev`

### Dockerized Development

> You will need [Docker](https://www.docker.com/get-started) running on your machine.

Run development environment:

`npm run dev`

Run only the development database:

`npm run db`

Remove persisted data within the Postgres container:

`npm run db:rm`

## Quality Assurance

### Testing

Run integration and unit test:

`npm test`

Start test in watch mode:

`npm run test:watch`

### Code Coverage

Generate a coverage report:

`npm run coverage`

### Linting

Run TSLint and Prettier to analyze source code:

`npm run lint`

Run TSLint and Prettier to correct syntax issues:

`npm run lint:fix`

### Mapping Dependencies

Check for circular dependencies:

`npm run dependency:check`

Generate a depepndency graph: 

`npm run dependency:graph`

> The report can be found at: [`docs/dependency.png`](docs/dependencies.png)

## Staging Environment

Build and run staging environment:

`npm run staging`

Remove staging environment container:

`npm run staging:rm`

## Production

Build production image:

`npm run build:image`

Docker will provide an image and tag which can be used for containerized deployments such as: [Kubernetes](https://kubernetes.io/) or [Docker Hub](https://hub.docker.com/).

## Important Notes

### Running in Windows

Docker on windows utilizes a [local virtual machine](https://docs.docker.com/machine/get-started/) for networking, this can make accessing exposed ports difficult. First, start the virtual host then locate the host's IP address:

`docker-machine start`

`npm run docker:host`

Use the IP address from the previous step to access your dev environments Postgres database. Configure `DB_HOST` environment variable with the following template:

`DB_HOST=<docker-machine-ip>`

This is also the IP address used to access the service via the staging environment. Here is an example request with [curl](https://curl.haxx.se/docs/manpage.html):

`curl http://<docker-machine-ip>:5000/health`

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
