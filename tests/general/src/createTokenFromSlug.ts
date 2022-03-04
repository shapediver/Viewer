import { create, ModelGetEmbeddableFields } from '@shapediver/sdk.platform-api';
import { credentials } from './credentials';
const { exec } = require("child_process");

const slug = process.argv[2];
const platformBackend = process.argv[3];

const execPromise = (cmd: string) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error: any, stdout: any) => {
            if (error) throw new Error(error);
            if (!error && typeof stdout === 'string') resolve(stdout.replace('\n', ''));
        });
    });
}

const createToken = async (slug: string, platformBackend: string = 'https://app.shapediver.com'): Promise<string> => {
    try {
        const client = create({clientId: credentials.clientId, baseUrl: platformBackend});
        await client.authorization.passwordGrant(credentials.username, credentials.password);
        
        // get id via get model call
        const model = await client.models.get(slug, [ModelGetEmbeddableFields.Ticket, ModelGetEmbeddableFields.BackendSystem]);
        
        const token = await client.tokens.create({
            id: model.data.id,
            scope: ["group.view", "group.export", "group.owner"]
        })    
        return token.data.access_token;
    } catch (e) {
        throw e;
    }
}

export const createTokenFromSlug = async (slug: string): Promise<string> => {
    return <string>await execPromise(`cd ../.. && npm run --silent platform-api-token ${slug}`);
}

(async () => {
    const token = await createToken(slug, platformBackend);
    console.log(token);
})();
