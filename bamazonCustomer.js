var inquirer = require("inquirer");
var mysql = require("mysql");
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "P@ssw0rd",
    database: "bamazon"
});

//first connection
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    //createProduct();
    listProducts();
});

var items;
var item;
function listProducts(){
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        items = res;
        for( var i=0; i < items.length; i++){
            console.log( items[i].item_id, items[i].product_name, items[i].price )
        }
        var itemIds = items.map(item => item.item_id)

        requestPurchase( itemIds )

    })
}

function requestPurchase(itemIds){
    inquirer.prompt([
        {
            name: "itemId",
            message: "What is the item id (first number) of the item you would like to purchase?",
            type: 'input',
            validate: function(input){
                if( itemIds.indexOf( parseInt( input.trim() ) ) === -1){
                    return "Item id does not exist"
                }
                return true;
            }
        },
        {
            name: "quant",
            message: "How many would you like to purchase?",
            type: 'input',
            validate: function(input) {
                var isValid = !isNaN(parseInt(input));
                return isValid || "Quantity must be a number";
            }
        }
    ]).then(function (answers) {
        var itemId = parseInt(answers.itemId);
        var quant = answers.quant
        var inStock = checkIfInStock( itemId , quant )
        
        if( inStock ){
            purchaseItem( itemId , quant )
        } else {
            console.log('Insufficient quantity of item in stock!')
            reset();
        }
    })
}
function checkIfInStock(itemId, quant){
    for( var i=0; i < items.length; i++){
        if( itemId === items[i].item_id ){
            item = items[i];
        }
    }
    if( item.stock_quantity >= quant ){
        return true;
    } else {
        return false;
    }
}

function purchaseItem( itemId, quant){
    var query = connection.query(
        "UPDATE products SET ? WHERE ?",
        [
            {
                stock_quantity: quant
            },
            {
                item_id: itemId
            }
        ],
        function (err, res) {
            console.log("Purchase complete!");
            var total = item.price * quant;
            console.log('Total comes to:', total,"\n")
            updateProductSales(itemId, total);
            reset();
        }
    );
}
function updateProductSales(itemId, total){
    total = connection.escape( total );
    var query = connection.query(
        "UPDATE products SET product_sales=product_sales + "+total+" WHERE ?",
        [
            {
                item_id: itemId
            }
        ],
        function (err, res) {
            if( err ) console.log( err )
        }
    );
    console.log( query.sql )
}
function reset(){
    items = null;
    item = null;
    listProducts();
}
// list listProduct
// ask for id of item wanted
//     ask again number of units
// check if enough product in stock
//     display insufficient quantity
//     and prevent
//     OR
//     update sql quantity
//     show customer cost 
