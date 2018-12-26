const mongoose = require('mongoose');

let productSchema = new mongoose.Schema({
    productname: String,
    productdetails: String,
    price: String,
    dateCrawled: Date
});

let Product = mongoose.model('Product', productSchema);

module.exports = Product;

 
