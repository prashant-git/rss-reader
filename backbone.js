$(function() { 
  
  
var Item = Backbone.Model;  
 var customURL= "/all" ; 
    var Items = Backbone.Collection.extend({ 
      
            url: customURL, 
   
        parse: function(response) { 
              
            var filtered = _.filter(response, function(d) {  
  
               return true; 
  
            }); 
              
            this.add(filtered); 
              
        }, 
              
        initialize: function() { 
          this.fetch(); 
        } 
  }); 
   
  
  
//... Model and Collection code ...// 
   
   
//-- Views --------------------------------------------------------------------// 
      
    var List = Backbone.View.extend({ 
          
        el: $('body'), 
                          
        initialize: function() { 
              
            // Bind an event to add tweets from the collection 
              
            this.collection.bind('add', function(model) { 
                  
                 var ch_title = model.get('channel_title');  
                  
                 $('.channels').append('<li>'+ch_title+'</li>'); 
  
                  
                }); 
  
            }, 
            events: { 
                'click #add_button' : 'addRSS', 
                // 'click .channels li': 'loadItems' 
                  
            }, 
            addRSS: function() { 
                if(document.getElementById('add_input').value !== '') { 
                    this.collection.url= '/add_channel?channel='+document.getElementById('add_input').value; 
                    this.collection.fetch({reset: true}); 
                } 
            }, 
            loadItems: function(e) { 
                this.collection.url= '/load_items?channel='+'How to of the Day'; 
                    this.collection.fetch({reset: true}); 
            } 
  
    }); //-- End of view 
   
   
//... Mode, Collection, and View code ...// 
   
   
//-- Initialize ---------------------------------------------------------------// 
      
    // Create an instance of the tweets collection 
    var items = new Items({ 
        model: Item 
    }); 
   
    // Create the Map view, binding it to the tweets collection     
    var list = new List({ 
        collection: items 
    }); 
   
  
  
$.getJSON('/load_items', function(data) { 
  
  $.each(data, function(key,val) { 
    console.log(val); 
    $('#items').append('<h3>'+  val.item_title + '</h3>'); 
    $('#items').append('<div>'+  val.item_desc + '</div>'); 
  
    $.ajax({ 
        type:"GET", 
        url: ''+val.item_link, 
     
    }).done(function(data) { 
        $('#items').append('<div>'+  data + '</div>'); 
    }); 
  
  }); 
  
  $(function() { 
    $( "#items" ).accordion({ 
      heightStyle: "content"
    }); 
  }); 
    
}); 
    /*       
   $.ajax({ 
  type: "GET", 
  url: "/load_items", 
   
}).done(function(msg) { 
    console.log(msg); 
  $('#items').append('<h3>'+msg.item_title+'</h3>'+'<div>'+msg+'</div>'); 
}); 
    */  
  
  
}); 