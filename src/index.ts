import "reflect-metadata";
import { createConnection } from "typeorm";

import Application from "./app";

const PORT = process.env.PORT || 5000;

const app = new Application();

async function startServer(port: number) {
	try {
		await createConnection();
		app.server.listen(port, () => {
			// tslint:disable-next-line:no-console
			console.log(`Server stated on port ${port}`);
		})
	} catch(error) {
		// tslint:disable-next-line:no-console
		console.log(error);
	}
}

startServer(PORT as number);
