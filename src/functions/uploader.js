const { app } = require('@azure/functions');
const multipart = require('parse-multipart')

app.http('uploader', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const buffer = await request.arrayBuffer()
            const binaryFiles = Buffer.from(buffer)
            const boundry = multipart.getBoundary(request.headers.get('Content-Type'))

            const files = multipart.Parse(binaryFiles, boundry)
            context.log('files', files)

            if (files.length == 0) {
                return { body: 'Nothing to upload' }
            }


            return { body: 'cool' }

        } catch (error) {
            return {
                status: 400,
                body: error.message
            }
        }




    }
});
