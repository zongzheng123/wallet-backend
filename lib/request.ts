export const request = (url: string, options?: RequestInit) => {
    return fetch(`https://app.bi-tech.monster/api/${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
            Authorization: `Bearer ${process.env.API_TOKEN}`
        }
    })
}