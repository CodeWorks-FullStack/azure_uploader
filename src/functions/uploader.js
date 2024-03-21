const { app } = require('@azure/functions');
const multipart = require('parse-multipart')
const { BlobServiceClient } = require('@azure/storage-blob')

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

            const uploadables = []

            files.forEach(f => {
                // TODO skip if its a bad fileType
                uploadables.push({
                    file: f,
                    fileName: f.filename,
                    fileType: f.type,
                    length: f.data.byteLength,
                    size_kb: f.data.byteLength / 1024,
                    size_mb: f.data.byteLength / 102400,
                    url: ''
                })
            })


            // verify container
            const blobStorage = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage)

            const container = blobStorage.getContainerClient('public')
            await container.createIfNotExists({ access: 'blob' })

            // upload blockblobs (aka files)
            uploadables.forEach(f => {
                const blockBlob = container.getBlockBlobClient(`images/${Date.now()}_${f.fileName}`)
                blockBlob.upload(f.file.data, f.length, {
                    blobHTTPHeaders: {
                        blobContentType: f.fileType,
                        blobCacheControl: 'max-age=36000'
                    }
                })
                f.url = blockBlob.url
            })



            return {
                status: 200,
                body: JSON.stringify(uploadables.map(f => {
                    return { url: f.url, size_kb: f.size_kb, size_mb: f.size_mb }
                })),
                headers: {
                    'Content-Type': 'application/json'
                }
            }

        } catch (error) {
            return {
                status: 400,
                body: error.message
            }
        }




    }
});
