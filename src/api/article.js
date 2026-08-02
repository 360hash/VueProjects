const API_URL =
"https://360blog.exploresea360.workers.dev"


export function getArticles(){

    return fetch(
        API_URL + "/api/articles"
    )
    .then(res=>res.json())

}