export async function errorReturnDb(error: any) {
    return {success: false, error: error, data: null}
}

export async function successReturnDb(data: any) {
    return {success: true, error: null, data: data}
}