//require all of mysql, inquirer, dotenv, and the local keys file
var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");
require("dotenv").config();
var keys = require("./keys.js");
//sets mySql connection
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    // Links to env password password
    password: keys.mySql.password,
    database: "bamazon_db"
});
// Create a constructor table using the cli-table npm
var table = new Table({
    head: ['ID', 'Product Name', 'Department Name', 'Price', 'Stock Quantity'],
    chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
        , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
        , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
        , 'right': '║', 'right-mid': '╢', 'middle': '│'
    }
});
//connecting to mysql database
connection.connect(function (err) {
    if (err) throw err;
    //pulling data from the products table
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        //assigning results to variable queryRes
        queryRes = res;
    });
    //initiate inquirer npm to ask user to select choice
    inquirer.prompt([
        {
            type: "list",
            name: "userCommand",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"],
            message: "Choose your option"
        }
    ]).then(function (command) {
        var userCommand = command.userCommand;
        //Creating switch function to run code depending on the user's previous selection
        switch (userCommand) {
            case "View Products for Sale":
                //create a for loop to loop through results and push selected data to the Table constructor
                for (let index = 0; index < queryRes.length; index++) {
                    table.push([queryRes[index].id, queryRes[index].product_name, queryRes[index].department_name,
                    queryRes[index].price, queryRes[index].stock_quantity]);
                }
                console.log(table.toString());
                connection.end();
                break;
            case "View Low Inventory":
                //Create a for loop to loop through entire products table and push results to the Table constructor if stock quantity is less than 20
                for (let index = 0; index < queryRes.length; index++) {
                    if (queryRes[index].stock_quantity < 20) {
                        table.push([queryRes[index].id, queryRes[index].product_name, queryRes[index].department_name,
                        queryRes[index].price, queryRes[index].stock_quantity]);
                    }
                }
                console.log(table.toString());
                connection.end();
                break;
            case "Add to Inventory":
                //create an empty results array to push all products data to for the user to select option from in inquirer prompt
                var resultsArr = [];
                for (let index = 0; index < queryRes.length; index++) {
                    resultsArr.push("ID: " + queryRes[index].id + " Item: " + queryRes[index].product_name + " Department Name: " + queryRes[index].department_name
                        + " Price: " + queryRes[index].price + " Stock Qty: " + queryRes[index].stock_quantity);
                }
                //use inquirer npm to ask user to select from products table the item they would like to add inventory to
                inquirer.prompt([
                    {
                        type: "list",
                        name: "userCommand",
                        choices: resultsArr,
                        message: "Select Product to Add Inventory to"
                    }
                ]).then(function (command) {
                    var userCommand = command.userCommand;
                    //sets the item selected by isolating the item number which starts at index 4 and ends right before the space before "item"
                    var product_ID = userCommand.substring(
                        userCommand.indexOf("ID: ") + 4,
                        userCommand.indexOf(" Item")
                    );
                    //use inquirer npm to prompt user to insert a quantity of inventory to add
                    inquirer.prompt([
                        {
                            type: "input",
                            name: "add_qty",
                            message: "Enter Quantity to Add to Inventory"
                        },

                    ]).then(function (item) {
                        //set variable stockQty equal to correct index from queryRes b/c it is an array starting at position 0 and ID starts at position 1
                        var stockQty = queryRes[product_ID - 1].stock_quantity;
                        //set variable newQty equal to stock qty + user input qty
                        var newQty = parseInt(stockQty) + parseInt(item.add_qty);
                        //connect to Bamazon database to update the stock quantity
                        connection.query("UPDATE products SET stock_quantity = ? WHERE id = ?", [newQty, product_ID], function (err, res) {
                            if (err) throw err;
                            //connect to Bamazon database to pull new data
                            connection.query("SELECT * FROM products", function (err, res) {
                                if (err) throw err;
                                updateInv = res;
                                //push results of new data pull to Table constructor
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
                //use inquirer npm to get user's input for new product
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
                    //set department found equal to false so that if department is not found it will throw error
                    var department_found = false;
                    //use for loop to loop through query results to see if the department of the new item exists
                    for (let index = 0; index < queryRes.length; index++) {
                        if (newItem.department === queryRes[index].department_name) {
                            //if department exists run the createItem function to add to products database and update table results
                            createItem(newItem.name, newItem.department, newItem.price, newItem.quantity);
                            //set department found to true so that you don't throw an error below
                            department_found = true;
                            break;
                        }
                    }
                    //if the department does not exist prompt user to contact Supervisor to add the department
                    if (!department_found) {
                        console.log(newItem.department + " department does not exist in the database.  Please contact the Bamazon Supervisor.")
                        connection.end();
                    }
                })
                break;
        }

    })
});
//function to add new item to products table and push results into Table constructor
function createItem(productName, departmentName, price, stockQuantity) {
    console.log("Inserting a new item...\n");
    //connecting to bamazon to add new product info from previous inquirer response into products table
    var query = connection.query("INSERT INTO products SET ?",
        {
            product_name: productName,
            department_name: departmentName,
            price: price,
            stock_quantity: stockQuantity
        },
        function (err, res) {
            if (err) throw err;
            //connecting to bamazon to pull new row of data from products since the newest product will have the highest id
            connection.query("SELECT * FROM products WHERE id=(SELECT max(id) FROM products)", function (err, res) {
                if (err) throw err;
                updateInv = res;
                //push results from the data pull into the Table constructor
                table.push([updateInv[0].id, updateInv[0].product_name, updateInv[0].department_name,
                updateInv[0].price, updateInv[0].stock_quantity]);
                console.log(table.toString());
                connection.end();
            });

        });
}