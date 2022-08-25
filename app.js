const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"));

//creating connection to todolistDB
mongoose.connect("mongodb+srv://bmuppalla1:Bhargav%40143@cluster0.bvcmanr.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];


app.get("/", function(request, response){
  //var day = date();
  Item.find({}, function(err, items){
    if(items.length == 0){
      Item.insertMany(defaultItems, function(err){
        if(err)
          console.log(err);
        else
          console.log("successfully inserted default items to DB");
      });
      response.redirect("/")
    }
    else {
      response.render('list', {listTile: "Today", newItems: items});
    }
  });

});

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/:listType", function(req,res){
  const listType = _.capitalize(req.params.listType);

  const list = new List({
      name: listType,
      items: defaultItems
    });

  List.findOne({name: listType}, function(err, result){
    if(result){
      res.render('list', {listTile: result.name, newItems: result.items});
    }
    else{
      list.save();
      console.log("Doesn't exists");
      res.redirect("/"+listType);
    }
  });

});

app.get("/about", function(request, response){
  response.render('about');
})

app.post("/", function(request, response){
  var item = request.body.newItem;
  const listName = request.body.list;
  const newItem = new Item({
    name: item
  });

  if(listName === "Today"){
    newItem.save()
    response.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, result){
      result.items.push(newItem);
      result.save();
      response.redirect("/"+listName);
    });
  }

});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName == "Today"){
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(err)
        console.log(err);
      else
        console.log("successfully deleted");
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name: listName},
      {$pull: {items: {_id: checkedItemId}}}, function(err, result){
      if(!err)
        res.redirect("/"+listName);
    });
  }
});


app.listen(process.env.PORT || 3000, function(request,response){
  console.log("server runnning on port 3000");
});
