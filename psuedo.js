var inquirer = require("inquirer");
var mysql = require("mysql");
var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "eragon77",
    database: "bidding_appdb"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    //createProduct();
    askForAction();
});


function askForAction() {
    inquirer.prompt([
        {
            name: "postBid",
            message: "Would you like to [POST] or [BID]?",
            type: 'list',
            choices: ["[POST]", "[BID]", '[EXIT]']

        }
    ]).then(function (answer) {
        console.log(answer.postBid)
        if (answer.postBid === "[POST]") {
            postItem();
        } else if (answer.postBid === "[BID]") {
            bid();
        } else {
            //close sql connection
            //exit
        }
    })
}
function nonEmpty(input) {
    return input.trim() !== '';
}
function isNum(input) {
    var isValid = !isNaN(parseFloat(input));
    return isValid || "Age should be a number!";
}
function postItem() {
    inquirer.prompt([
        {
            name: "itemName",
            message: "What is the name of your item?",
            type: 'input',
            validate: nonEmpty
        }, {
            name: "itemCat",
            message: "What category is this post?",
            type: 'input'
        }, {
            name: "itemPrice",
            message: "What is the price you are asking for?",
            type: 'input',
            validate: isNum
        }
    ]).then(function (answers) {
        console.log(" Your auction was created successfully! ");
        console.log({
            name: answers.itemName,
            cat: answers.itemCat,
            price: answers.itemPrice
        })

        var query = connection.query(
            "INSERT INTO auctions SET ?",
            {
                name: answers.itemName,
                bid: answers.itemPrice,
                category: answers.itemCat
            },
            function (err, res) {
                console.log(res.affectedRows + " product inserted!\n");
                // Call updateProduct AFTER the INSERT completes
                //updateProduct();
                askForAction();
            }
        );


    })
}
function bid() {
    connection.query("SELECT * FROM auctions", function (err, res) {
        if (err) throw err;
        console.log(JSON.stringify(res, null, 2));
        var items = res;

        inquirer.prompt([

            {
                name: "itemsList",
                message: "What would you like to bid on?",
                type: 'list',
                choices: items.map((item) => item.id + ' ' + item.name)
            }
        ]).then(function (answers) {
            console.log(answers.itemsList);

            var answerId = answers.itemsList.split(' ')[0];
            var item;
            for (var i = 0; i < items.length; i++) {
                if (items[i].id === parseInt(answerId)) {
                    item = items[i]
                }
            }
            inquirer.prompt([
                {
                    name: "bid",
                    message: "Current bid is: " + item.bid + ". What would you like to bid?",
                    type: 'input',
                    validate: function (input) {
                        var number = parseFloat(input.trim());
                        if (isNaN(number)) return 'Bid must be a valid number'
                        if (number <= parseFloat(item.bid)) return 'Bid must be higher than prev bid'
                        return true;
                    }
                }
            ]).then(function (answers) {
                console.log(answers.bid);

                var query = connection.query(
                    "UPDATE auctions SET ? WHERE ?",
                    [
                        {
                            bid: answers.bid
                        },
                        {
                            id: parseInt(item.id)
                        }
                    ],
                    function (err, res) {
                        console.log(res.affectedRows + " products updated!\n");
                        askForAction();
                    }
                );
                console.log(query.sql)

            })
        })
    });

}

