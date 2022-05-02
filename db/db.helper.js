
// na zaklade tutorialu https://blog.logrocket.com/build-rest-api-node-express-mysql/?fbclid=IwAR1RblVor96nzPkB-bQ8WRmbEgZ9eBzMjJ0uNmNQ9dossIDRsdZFW0WB6HQ

function emptyOrRows(rows) {
    if (!rows) {
        return [];
    }
    return rows;
}


//implementacia strankovania
function getOffset(currentPage = 1, rowsPerPage){

    return (currentPage -1)*rowsPerPage;
}


function getTotalPages(itemsCount, rowsPerPage){

    return (itemsCount > 0)? Math.ceil(itemsCount/rowsPerPage) : 1;

}

module.exports = {emptyOrRows, getOffset, getTotalPages}