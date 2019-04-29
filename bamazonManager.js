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
    
    listOptions();
});


function listOptions(){
    inquirer.prompt([
        {
            name: "option",
            message: "What would you like to do?",
            type: 'list',
            choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product']
        }
    ]).then(function (answers) {
        switch( answers.option ){
            case 'View Products for Sale':
                listProducts();
                break;
            case 'View Low Inventory':
                listLowInventory();
                break;
            case 'Add to Inventory':
                addToInventory();
                break;
            case 'Add New Product':
                addNewItem();
                break;
        }
    })
}


var items;
function listProducts(){
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        items = res;
        for( var i=0; i < items.length; i++){
            console.log( items[i].item_id, items[i].product_name, items[i].price, items[i].stock_quantity )
        }

        listOptions();
    })
}
function listLowInventory(){
    connection.query("SELECT * FROM products WHERE stock_quantity < 5", function (err, res) {
        if (err) throw err;
        items = res;
        for( var i=0; i < items.length; i++){
            console.log( items[i].item_id, items[i].product_name, items[i].price, items[i].stock_quantity )
        }

        listOptions();
    })
}

function addToInventory(){
    var itemIds = items.map(item => item.item_id)
    inquirer.prompt([
        {
            name: "itemId",
            message: "What is the item id of the item you would like replenish in inventory?",
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
            message: "How many would you like to replenish up to?",
            type: 'input',
            validate: function(input) {
                var isValid = !isNaN(parseInt(input));
                return isValid || "Quantity must be a number";
            }
        }
    ]).then(function (answers) {
        var itemId = parseInt(answers.itemId);
        var quant = answers.quant;
        var inStock = checkIfInStock( itemId , quant )
        
        replenishStock( itemId, quant );
    })

}

function replenishStock( itemId, quant ){
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
            console.log("Replenish complete!");
            listOptions();
        }
    );
}

function addNewItem(){
    inquirer.prompt([
        {
            name: "name",
            message: "What is the name of the item you would like add?",
            type: 'input',
            validate: function(input){
                return input.trim() !== '' || 'Name cannot be left empty';
            }
        },
        {
            name: "dept",
            message: "What is the department this item belongs to?",
            type: 'input',
            validate: function(input){
                return input.trim() !== '' || 'Dept cannot be left empty';
            }
        },
        {
            name: "price",
            message: "What price would you like the item to have?",
            type: 'input',
            validate: function(input){
                var isValid = !isNaN(parseFloat(input));
                return isValid || "Price must be a number";
            }
        },
        {
            name: "quant",
            message: "How many would you like to start with?",
            type: 'input',
            validate: function(input) {
                var isValid = !isNaN(parseInt(input));
                return isValid || "Quantity must be a number";
            }
        }
    ]).then(function (answers) {
        
        connection.query('INSERT INTO products SET ?', {
            product_name: answers.name,
            department_name: answers.dept,
            price: parseFloat(answers.price),
            stock_quantity: parseInt( answers.quant)
        }, function (error, results, fields) {
            if (error) throw error;
            console.log('Item successfully made with id:',results.insertId);
            listOptions();
          });
          
    })
}
