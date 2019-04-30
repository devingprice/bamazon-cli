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
            choices: ['View Product Sales by Department', 'Create New Department']
        }
    ]).then(function (answers) {
        switch( answers.option ){
            case 'View Product Sales by Department':
                viewDepartment();
                break;
            case 'Create New Department':
                createDepartment();
                break;
        }
    })
}

function viewDepartment(){
    connection.query("SELECT * FROM departments LEFT JOIN products ON departments.department_name=products.department_name", 
    function (err, res) {
        if (err) throw err;
        var lineItems = [];
        for( var i=0; i < res.length; i++){
            var loc = lineItems.indexOf(res[i].department_name);
            if( loc  === -1 ){
                lineItems.push( {
                    department_id: res[i].department_id,
                    department_name: res[i].department_name,
                    over_head_costs: res[i].over_head_costs,
                    product_sales: res[i].product_sales
                } )
            } else {
                lineItems[ loc ].product_sales += res[i].product_sales;
            }
        }

        console.log(
            "department_id".padEnd(20,' '),
            "department_name".padEnd(20,' '),
            "over_head_costs".padEnd(20,' '),
            "product_sales".padEnd(20,' '),
            "total_profit".padEnd(20,' ')
        )
        for( var i=0; i < lineItems.length; i++){
            console.log(
                (lineItems[i].department_id +'').padEnd(20,' '),
                (lineItems[i].department_name +'').padEnd(20,' '),
                (lineItems[i].over_head_costs +'').padEnd(20,' '),
                (lineItems[i].product_sales +'').padEnd(20,' '),
                (""+(lineItems[i].product_sales - lineItems[i].over_head_costs)).padEnd(20,' '),
            )
        }

        listOptions();
    })
}

function createDepartment(){
    inquirer.prompt([
        {
            name: "name",
            message: "What is the name of the department you would like add?",
            type: 'input',
            validate: function(input){
                return input.trim() !== '' || 'Department name cannot be left empty';
            }
        },
        {
            name: "overhead",
            message: "What are the department's overhead costs?",
            type: 'input',
            validate: function(input){
                var isValid = !isNaN(parseFloat(input));
                return isValid || "Price must be a number";
            }
        }
    ]).then(function (answers) {
        
        connection.query('INSERT INTO departments SET ?', {
            department_name: answers.name,
            over_head_costs: parseFloat(answers.overhead)
        }, function (error, results, fields) {
            if (error) throw error;
            console.log('Department successfully made with id:', results.insertId);
          });
          
        listOptions();
    })
}
