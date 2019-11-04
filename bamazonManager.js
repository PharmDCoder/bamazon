// Assigning required 
var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");
var connection = mysql.createConnection({
    host: "localhost",
    // Your port; if not 3306
    port: 3306,
    // Your username
    user: "root",
    // Your password
    password: "Jleigh08",
    database: "bamazon_db"
});

var table = new Table({
    head: ['ID', 'Product Name', 'Department Name', 'Price', 'Stock Quantity'],
    chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
        , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
        , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
        , 'right': '║', 'right-mid': '╢', 'middle': '│'
    }
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        queryRes = res;
    });
    inquirer.prompt([
        {
            type: "list",
            name: "userCommand",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"],
            message: "Choose your option"
        }
    ]).then(function (command) {
        var userCommand = command.userCommand;
        switch (userCommand) {
            case "View Products for Sale":
                console.log("user picked 'View Products for Sale'");
                // instantiate
                for (let index = 0; index < queryRes.length; index++) {
                    table.push([queryRes[index].id, queryRes[index].product_name, queryRes[index].department_name,
                    queryRes[index].price, queryRes[index].stock_quantity]);
                }
                console.log(table.toString());
                connection.end();
                break;
            case "View Low Inventory":
                //I want to go back and add a minimum column and if current inventory is below pull that
                console.log("user picked 'View Low Inventory'");
                for (let index = 0; index < queryRes.length; index++) {
                    if (queryRes[index].stock_quantity < 30) {
                        table.push([queryRes[index].id, queryRes[index].product_name, queryRes[index].department_name,
                        queryRes[index].price, queryRes[index].stock_quantity]);
                    }
                }
                console.log(table.toString());
                connection.end();
                break;
            case "Add to Inventory":
                console.log("user picked 'Add to Inventory'");
                var resultsArr = [];
                for (let index = 0; index < queryRes.length; index++) {
                    resultsArr.push("ID: " + queryRes[index].id + " Item: " + queryRes[index].product_name + " Department Name: " + queryRes[index].department_name
                        + " Price: " + queryRes[index].price + " Stock Qty: " + queryRes[index].stock_quantity);
                }

                inquirer.prompt([
                    {
                        type: "list",
                        name: "userCommand",
                        choices: resultsArr,
                        message: "Select Product to Add Inventory to"
                    }
                ]).then(function (command) {
                    var userCommand = command.userCommand;
                    var product_ID = userCommand.substring(
                        userCommand.indexOf("ID: ") + 4,
                        userCommand.indexOf(" Item")
                    );

                    inquirer.prompt([
                        {
                            type: "input",
                            name: "add_qty",
                            message: "Enter Quantity to Add to Inventory"
                        },

                    ]).then(function (item) {
                        var stockQty = queryRes[product_ID - 1].stock_quantity;
                        var newQty = parseInt(stockQty) + parseInt(item.add_qty);
                        console.log(product_ID);
                        connection.query("UPDATE products SET stock_quantity = ? WHERE id = ?", [newQty, product_ID], function (err, res) {
                            
                            if (err) throw err;

                            connection.query("SELECT * FROM products", function (err, res) {
                                if (err) throw err;
                                updateInv = res;
                                table.push([updateInv[product_ID - 1].id, updateInv[product_ID - 1].product_name, updateInv[product_ID - 1].department_name,
                                updateInv[product_ID - 1].price, updateInv[product_ID - 1].stock_quantity]);
                                console.log(table.toString());
                                connection.end();
                            });
                        });
                    });
                })
                break;
            case "Add New Product":
                console.log("user picked 'Add New Product'");
                inquirer.prompt([
                    {
                        type: "input",
                        name: "name",
                        message: "Enter name of product"
                    },
                    {
                        type: "input",
                        name: "department",
                        message: "Enter department name"
                    },
                    {
                        type: "input",
                        name: "price",
                        message: "Enter price"
                    },
                    {
                        type: "input",
                        name: "quantity",
                        message: "Enter stock quantity"
                    }
                ]).then(function (newItem) {
                    createItem(newItem.name, newItem.department, newItem.price, newItem.quantity);
                })
                break;
        }

    })
});

function createItem(productName, departmentName, price, stockQuantity) {
    console.log("Inserting a new item...\n");
    var query = connection.query("INSERT INTO products SET ?",
        {
            product_name: productName,
            department_name: departmentName,
            price: price,
            stock_quantity: stockQuantity
        },
        function (err, res) {
            if (err) throw err;
            console.log(productName + " inserted!\n");
            connection.end();
        }
    );
}