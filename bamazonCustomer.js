var mysql = require("mysql");
var inquirer = require("inquirer");
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

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    readItems();
});

function createItem(newItem, newSeller, newPrice) {
    console.log("Inserting a new item...\n");
    var query = connection.query(
        "INSERT INTO inventory SET ?",
        {
            name: newItem,
            seller: newSeller,
            price: newPrice
        },
        function (err, res) {
            if (err) throw err;
            console.log(res.affectedRows + " auction inserted!\n");
        }
    );
    // logs the actual query being run
    console.log(query.sql);
}

function readItems() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        var resultsArr = [];
        divider = "\n\n";
        for (let index = 0; index < res.length; index++) {
            resultsArr.push("ID: " + res[index].id + " Item: " + res[index].product_name + " Department Name: " + res[index].department_name
                + " Price: " + res[index].price + " Stock Qty: " + res[index].stock_quantity);
        }

        inquirer.prompt([
            {
                type: "list",
                name: "userCommand",
                choices: resultsArr,
                message: "Select Product to Purchase"
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
                    name: "purchase_qty",
                    message: "Enter Quantity to Purchase"
                },

            ]).then(function (item) {
                var stockQty = res[product_ID - 1].stock_quantity;
                var difference = parseInt(stockQty) - parseInt(item.purchase_qty);
                console.log(difference);
                if (difference >= 0) {
                    connection.query("UPDATE products SET stock_quantity = ? WHERE id = ?", [difference, product_ID], function (err, res) {
                        if (err) throw err;
                    });
                    var totalCost = parseInt(item.purchase_qty) * parseFloat(res[product_ID-1].price);
                    console.log("You're total is $" +totalCost);
                } else {
                    console.log("Sorry, there are not enough items in stock to purchase");
                }
                connection.end();


            });

        })

    })

};