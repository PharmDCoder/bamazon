//require all of mysql, inquirer, dotenv, and the local keys file
var mysql = require("mysql");
var inquirer = require("inquirer");
require("dotenv").config();
var Table = require("cli-table");
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
    head: ['department_id', 'department_name', 'over_head_costs', 'product_sales', 'total_profit'],
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
    console.log("connected as id " + connection.threadId + "\n");
    //use inquirer npm to obtain the user's choice
    inquirer.prompt([
        {
            type: "list",
            name: "userCommand",
            choices: ["View Product Sales by Department", "Create New Department"],
            message: "Choose your option"
        }
    ]).then(function (command) {
        var userCommand = command.userCommand;
        //Set up function to run case chosen by user
        switch (userCommand) {
            case "View Product Sales by Department":
                //Connect to mysql to pull data from both 'products' and 'departments table' and dynamically generate the profits column
                connection.query("SELECT dep.department_id,dep.department_name, count(id) AS items_in_department, dep.over_head_costs, IFNULL(sum(product_sales),0.00) AS department_sales, IFNULL(sum(product_sales) - dep.over_head_costs,-dep.over_head_costs) AS profit FROM products prod RIGHT JOIN departments dep ON dep.department_name = prod.department_name GROUP BY department_name", function (err, res) {
                    if (err) throw err;
                    //create results variable
                    queryRes = res;
                    //use a for loop to pull each row of data from the results array and push to the Table constructor
                    for (let index = 0; index < queryRes.length; index++) {
                        table.push([queryRes[index].department_id, queryRes[index].department_name, queryRes[index].over_head_costs,
                        queryRes[index].department_sales, queryRes[index].profit]);
                    }
                    console.log(table.toString());
                    connection.end();
                });
                break;
            case "Create New Department":
                //use the inquirer npm to allow user to input data fields
                inquirer.prompt([
                    {
                        type: "input",
                        name: "name",
                        message: "Enter name of department"
                    },
                    {
                        type: "input",
                        name: "overhead",
                        message: "Enter department overhead cost"
                    }
                ]).then(function (newItem) {
                    //call the createItem function with the user's inputs as the parameters
                    createItem(newItem.name, newItem.overhead);
                })
                break;
        }
    })
});

function createItem(departmentName, overHeadCosts) {
    console.log("Inserting a new department...\n");
    //connect to bamazon database to insert new department and over head cost
    var query = connection.query("INSERT INTO departments SET ?",
        {
            department_name: departmentName,
            over_head_costs: overHeadCosts
        },
        function (err, res) {
            if (err) throw err;
            //connect to bamazon database to pull data from last department created
            connection.query("SELECT dep.department_id,dep.department_name, count(id) AS items_in_department, dep.over_head_costs, IFNULL(sum(product_sales),0.00) AS department_sales, IFNULL(sum(product_sales) - dep.over_head_costs,-dep.over_head_costs) AS profit FROM products prod RIGHT JOIN departments dep ON dep.department_name = prod.department_name WHERE department_id = (select max(department_id) from departments) GROUP BY department_name", function (err, res) {
                if (err) throw err;
                updateInv = res;
                //push results to Table constructor
                table.push([updateInv[0].department_id, updateInv[0].department_name, updateInv[0].over_head_costs,
                updateInv[0].department_sales, updateInv[0].profit]);
                console.log(table.toString());
                connection.end();
            });
        });
}