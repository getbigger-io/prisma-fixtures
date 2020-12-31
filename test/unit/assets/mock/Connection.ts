export class Connection {
    async $connect() {
        return;
    }

    async $disconnect() {
        return;
    }

    user = {
        create: (data: { data: any; }) => ({id: 1, ...data.data}),
    };

    listing = {
        create: (data: { data: any; }) => ({id: 1, ...data.data}),
    };

    post = {
        create: (data: { data: any; }) => ({id: 1, ...data.data}),
    };
}
