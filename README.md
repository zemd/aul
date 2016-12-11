# AUL

> Elegant database queries executor

[![npm version](https://badge.fury.io/js/aul.svg)](https://www.npmjs.com/package/aul)
[![Build Status](https://travis-ci.org/zemd/aul.svg?branch=master)](https://travis-ci.org/zemd/aul)
[![Code Climate](https://codeclimate.com/github/zemd/aul/badges/gpa.svg)](https://codeclimate.com/github/zemd/aul)
[![CircleCI](https://circleci.com/gh/zemd/aul/tree/master.svg?style=svg)](https://circleci.com/gh/zemd/aul/tree/master)
[![dependencies:?](https://img.shields.io/david/zemd/aul.svg)](https://david-dm.org/zemd/aul)
[![devDependencies:?](https://img.shields.io/david/dev/zemd/aul.svg?style=flat)](https://david-dm.org/zemd/aul)
[![Inline docs](http://inch-ci.org/github/zemd/aul.svg?branch=master)](http://inch-ci.org/github/zemd/aul)

## Introduction

Because every web developer must implement his own template engine and orm, this package was born. ORM is recently the most
popular way of working with data. It essentially great, but why everyone should think that tables in database is objects 
in the code - I don't know. Mapping going to be very complex procedure when you want to make something 
not usual and not common for every database engine. 

Quick example, if you worked with loopbackjs you probably know that you can't make joins, you can't use complex sql queries 
and map results automatically. SailsJS also has no transaction support! You need to make workaround each time you need to 
use SQL. So the question is - why do you ever need this abstraction if you limited with database common features. If you
want to switch to another database (postgresql -> mongo for example) you will definitely need to rewrite you model, and it's 
usage. And if you need to change your orm provider - you will need to change a lot of code, because each orm has it's own
model lifecycle.
  
Complexity of ORM/ODM solves many problems to hide that **DATA IS STORED IN DATABASE AS TABLE OR DOCUMENT**. And each such
library makes it's own approach that usually it is hard to *test queries*, *migrate from one orm to another*, *use SQL* or 
*use your database engine's features*. And I think DBA guys is not very happy with queries that orm usually builds.

## Installation

```bash
npm install aul --save
```

or

```bash
yarn add aul
```

## Usage

Let's make a quick example of how this `yet another orm killer` can help you with your database logic.

**NOTE 1:** you should know - your data is stored in tables, documents or any other storage you use in your app. And you access 
it by using it's natural syntax. If you need JOIN 2 tables, you may do this.

**NOTE 2:** Aul is general library with some basic abstractions around data queries. So you need to add some `adapter` for your 
database. (in the following example I will use knex adapter)


```javascript
const {Criteria, Executor} = require("aul");
const KnexAdapter = require("aul-knex");
const MyModel = require("./my-model");

// Firstly let's create general Criteria object which will hold all info about what we need to fetch from database
const criteria = new Criteria("table_name_or_collection_name");
criteria.addFilter("active", {active: true});
criteria.addMapper((result) => MyModel.from(result));

// Now let's instantiate executor and pass a `path` option so executor could find you custom filters
const executor = new Executor({path: "path/to/the/folder/with/filters"});

// we need to set adapter which will provide query builder and will execute the query
executor.setAdapter(new KnexAdapter({
    client: "pg", // DO NOT FORGET TO INSTALL `pg` module also
    connection: process.env.DATABASE_URL,
    searchPath: "public"
}));

// now we can execute our criteria
executor.execute(criteria);
```

So in this little example, we built custom criteria to fetch data from table called `table_name_or_collection_name` and 
also we defined that we want to filter all records by passing active **filter**. *Filter* is a simple middleware function that 
mutates query builder object in way it needs. For example, we have a query builder that holds `SELECT * FROM table` and after proceeding 
"active" filter, query will looks like `SELECT * FROM table WHERE active = true`.

As you may see you should implement your filter by yourself and executor must know where you filters are located.
  
*KnexAdapter* object is created by passing the same options that knex library requires. So nothing special here.
    
Now let's see how your active filter should look like:
 
```javascript
module.exports = ({active = true}) => {
  return async (knex, next) => {
      knex.andWhere('active', '=', !!active);
      await next();
  };
};
```

As you can see nothing special either. You just need to use knex query builder.

#### So what does it give to you?

 1. It gives you freedom. Now you do not need to think how to join or use some complex SQL, you simply use it.
 2. It gives you a way to abstract from SQL strings, and use query builder you want, you can use mongo client object if you want
 3. You can **test** each filter independently and **use** them like configuration parts of you criteria.
 4. You can migrate from one database to another by implementing filters for another adapter. But you do not need to change 
 criteria definition itself.
 5. It is very lightweight abstraction without any complex logic inside. Filters are running like regular middlewares one by one, 
 and they can be asynchronous.  

#### What about objects? Do you need mapper?

Sure. You need mapper. But you **can** to choose. Aul has very limited approach to map your data into pure object. 
You should provide your mapper in `criteria.setMapper()`. 

I will show example with mapping using `muesli` library.

```javascript
const Mapper = require("aul-muesli");
const Model = require("muesli");

class Author extends Model {
    constructor() {
        supper({
            name: {
                filter: "string",
                constraints: [required("group1")]
            },
            lastname: {
                filter: "string",
                constraints: [required()]
            },
            fullname: {
                filter: function (deps) { 
                    return deps.join(" ");
                },
                computed: ["name", "lastname"]
            }
        });
    }
}

class Book extends Model {
    constructor() {
        super({
            title: {
                filter: "string"
            }
        });
    }
}

const map = {
    // simple rule to map `column` -> `field`
    // if column name is the same with field name you can omit 
    "column": "field",
    //you can omit this column
    "column2": false, 
    // or you can pass your own mapping algorithm, to map nested models
    "authors": (authors) => authors.map(a => Author.from(a))
};

criteria.addMapper(map);
// Mapper can be pure function that obtain 1 result
criteria.addMapper((result) => Book.from(result));

// `execute` method is asynchronous
let results = await executor.execute(criteria);
```

You can have any amount of mappers. But remember order matters!

#### What about update/insert queries?

As you can see objects that you get in the end is not the same magic objects that you get in any ORM. You can't make 
save() or update(). Thus, you need to construct your own algorithm, where you can control batching, field passed etc.

Example,

```javascript

class UpdateCriteria extends Criteria {
    constructor() {
        super("table_name");
        this.addFilter("update", {active: true, status: "UPDATED"});
        
        this.addFilter("active", {active: false});
    }
} 
```

So now you see that UpdateCriteria is nothing else than regular criteria, where you can use your common filters.


## License

Aul is released under the MIT license.

## Donate

[![](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/red_rabbit)
[![](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/red_rabbit)

