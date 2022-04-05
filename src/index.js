const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const route = require('./routes/route');
const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended:true }));

mongoose.connect("mongodb+srv://thorium-cohort:qwertyuiop@cluster0.xyklh.mongodb.net/group54Database?authSource=admin&replicaSet=atlas-wc30tm-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true", {
    useNewUrlParser: true
})

.then( () => console.log("DataBase Is Connected"))
.catch ( () => console.log(err) )

app.use('/',route)

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app in running on PORT ' + (process.env.PORT || 3000))

});