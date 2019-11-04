//require all of mysql, inquirer, dotenv, and the local keys file
var mysql = require("mysql");
var inquirer = require("inquirer");
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

//Connecting to bamazon database to pull data from products table
connection.query("SELECT * FROM products", function (err, res) {
    if (err) throw err;
    // creating an empty resultsArr
    var resultsArr = [];
    // use a for loop to loop through results and push data into a results array to use as the options in next inquirer prompt
    for (let index = 0; index < res.length; index++) {
        resultsArr.push("ID: " + res[index].id + " Item: " + res[index].product_name + " Department Name: " + res[index].department_name
            + " Price: " + res[index].price + " Stock Qty: " + res[index].stock_quantity);
    }
    //using inquirer npm to have user select which product they want to purchase
    inquirer.prompt([
        {
            type: "list",
            name: "userCommand",
            choices: resultsArr,
            message: "Select Product to Purchase"
        }
    ]).then(function (command) {
        var userCommand = command.userCommand;
         //sets the item selected by isolating the item number which starts at index 4 and ends right before the space before "item"
        var product_ID = userCommand.substring(
            userCommand.indexOf("ID: ") + 4,
            userCommand.indexOf(" Item")
        );
        //use inquirer npm to ask user to select qty they want to purchase
        inquirer.prompt([
            {
                type: "input",
                name: "purchase_qty",
                message: "Enter Quantity to Purchase"
            },

        ]).then(function (item) {
            //set stockQty variable equal to the current stock qty from products table
            var stockQty = res[product_ID - 1].stock_quantity;
            //set difference variable equal to original stock qty - purchased qty
            var difference = parseInt(stockQty) - parseInt(item.purchase_qty);
            //check to make sure that there is enough inventory
            if (difference >= 0) {
                //set totalCost variable equal to purchase qty * price
                var totalCost = parseInt(item.purchase_qty) * parseFloat(res[product_ID - 1].price);
                console.log("You're total is $" + totalCost);
                //connect to bamazon to update stock quantity in products table
                connection.query("UPDATE products SET stock_quantity = ?, product_sales = ? WHERE id = ?", [difference, res[product_ID - 1].product_sales + totalCost, product_ID], function (err, res) {
                    if (err) throw err;

                });
            //if there is not enough inventory in stock alert the user 
            } else {
                console.log("Sorry, there are not enough items in stock to purchase");
            }
            connection.end();


        });

    })

})

