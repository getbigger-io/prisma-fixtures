export class Connection {
    async $connect() {
        return;
    }

    async $disconnect() {
        return;
    }

    user = {
        data: new Map<number, any>(),
        create: (data: { data: any }) => {
            const id = data.data.id || 1;

            if (this.user.data.has(id)) {
                throw 'Primary key already used';
            } else {
                this.user.data.set(id, data.data);
            }

            return { id: id, ...data.data };
        },
        findUnique: (data: { where: { id: number } }) => {
            return this.user.data.get(data.where.id);
        },
        update: (data: { where: { id: number }; data: any }) => {
            this.user.data.set(data.where.id, data.data);

            return this.user.data.get(data.where.id);
        },
    };

    listing = {
        create: (data: { data: any }) => ({ id: 1, ...data.data }),
    };

    post = {
        create: (data: { data: any }) => ({ id: 1, ...data.data }),
    };
}
