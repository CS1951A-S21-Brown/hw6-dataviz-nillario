// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

let svg = d3.select("#graph1")
    .append("svg")
    .attr("width", graph_1_width)     // HINT: width
    .attr("height", graph_1_height)     // HINT: height
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
let x = d3.scaleLinear()
    .range([0, graph_1_width - margin.left - margin.right]);

// TODO: Create a scale band for the y axis (artist)
let y = d3.scaleBand()
    .range([0, graph_1_height - margin.top - margin.bottom])
    .padding(0.1);  // Improves readability




function countGenres(data){
    const gc = {};
    function adddGc(element) {
        if (gc.hasOwnProperty(element)){
            gc[element] += 1;
        } else {
            gc[element] = 1;
        }
    }
    data.map(item => {
        item.listed_in.split(", ").forEach(element => adddGc(element));

    })
    var gcl = [];
    for (const key in gc) {
        gcl.push( {"genre": key, "count": gc[key]}  );

    }
    return gcl;
}


function setData() {
    const NUM_EXAMPLES = 15;
    // TODO: Load the artists CSV file into D3 by using the d3.csv() method. Index into the filenames array
    d3.csv("../data/netflix.csv").then(function(data) {
        // TODO: Clean and strip desired amount of data for barplot
        data = data.map(item => {
            new_item = item;
            new_item.release_year = parseInt(item.release_year);
            duration_str = item.duration;
            if (duration_str.substring(duration_str.length - 3, duration_str.length) === "min") {
                new_item.runtime = parseInt(duration_str.substring(0, duration_str.length-4));
            } else {
                new_item.runtime = 0;
            }

            return new_item;
        })
        gcl = countGenres(data);
        gcl = cleanData(gcl, compareCount, NUM_EXAMPLES);
        // TODO: Update the x axis domain with the max count of the provided data
        x.domain([0, d3.max(gcl.map(d => d.count))]);
        // TODO: Update the y axis domains with the desired attribute
        y.domain(gcl.map(d => d["genre"]));

        // HINT: Use the attr parameter to get the desired attribute for each data point

        // TODO: Render y-axis label
        let countRef = svg.append("g");
        // Set up reference to y axis label to update text in setData
        let y_axis_label = svg.append("g");
        y_axis_label.call(d3.axisLeft(y).tickSize(0).tickPadding(10));

        /*
            This next line does the following:
                1. Select all desired elements in the DOM
                2. Count and parse the data values
                3. Create new, data-bound elements for each data value
         */
        let bars = svg.selectAll("rect").data(gcl);

        // TODO: Render the bar elements on the DOM
        /*
            This next section of code does the following:
                1. Take each selection and append a desired element in the DOM
                2. Merge bars with previously rendered elements
                3. For each data point, apply styling attributes to each element

            Remember to use the attr parameter to get the desired attribute for each data point
            when rendering.
         */
        let color = d3.scaleOrdinal()
            .domain(gcl.map(function(d) { return d["genre"] }))
            .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#81c2c3"), NUM_EXAMPLES));

        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("fill", function(d) { return color(d["genre"]) })
            .transition()
            .duration(1000)
            .attr("x", x(0))
            .attr("y", function(d) { return y(d["genre"]) })               // HINT: Use function(d) { return ...; } to apply styles based on the data point
            .attr("width", function(d) { return x(d['count']) })
            .attr("height",  y.bandwidth());        // HINT: y.bandwidth() makes a reasonable display height

        /*
            In lieu of x-axis labels, we are going to display the count of the artist next to its bar on the
            bar plot. We will be creating these in the same manner as the bars.
         */
        let counts = countRef.selectAll("text").data(gcl);

        // TODO: Render the text elements on the DOM
        counts.enter()
            .append("text")
            .merge(counts)
            .transition()
            .duration(1000)
            .attr("x", function (d) {return x(d.count) + 5})       // HINT: Add a small offset to the right edge of the bar, found by x(d.count)
            .attr("y", function (d) {return y(d["genre"]) + 100*(y.padding())})       // HINT: Add a small offset to the top edge of the bar, found by y(d.artist)
            .style("text-anchor", "start")
            .text(function(d) { return d.count })
            .style("font-size", 8);           // HINT: Get the count of the artist

        svg.append("text")
            .attr("transform", `translate(${(graph_1_width-margin.left-margin.right)/2}, ${graph_1_height-margin.top-margin.bottom + 10})`)       // HINT: Place this at the bottom middle edge of the graph
            .style("text-anchor", "middle")
            .text("Count")
            .style("font-size", 12);

        let y_axis_text = svg.append("text")
            .attr("transform", `translate(${-150}, ${(graph_1_height-margin.top-margin.bottom)/2})`)       // HINT: Place this at the center left edge of the graph
            .style("text-anchor", "middle")
            .style("font-size", 12);

        // TODO: Add chart title
        let title = svg.append("text")
            .attr("transform", `translate(${(graph_1_width-margin.left-margin.right)/2}, ${-10})`)       // HINT: Place this at the top middle edge of the graph
            .style("text-anchor", "middle")
            .style("font-size", 15);
        y_axis_text.text("Genre");
        title.text("Most Common Netflix Genres");

        // Remove elements not in use if fewer groups in new dataset
        bars.exit().remove();
        counts.exit().remove();
    });
}


const compareCount = function(a,b) {
    return (-parseInt(a.count) + parseInt(b.count))
};

function cleanData(data, comparator, numExamples) {
    return data.sort(comparator).slice(0,numExamples)
    // TODO: sort and return the given data with the comparator (extracting the desired number of examples)
}


function actorPairs(data, threshhold){
    const actor_pairs = {};
    const single_actors = {};
    data.map(item => {
        act_list = item.cast.split(", ");
        for (var i = 0; i < act_list.length; i++) {
            element = act_list[i];
            if (single_actors.hasOwnProperty(element)){
                single_actors[element] += 1;
            } else {
                single_actors[element] = 1;
            }

            for (var j = 0; j < i; j++) {
                pair = [act_list[i], act_list[j]];
                if (actor_pairs.hasOwnProperty(pair)){
                    actor_pairs[pair] += 1;
                } else {
                    actor_pairs[pair] = 1;
                }
            }
        }

    })
    var sa = [];
    for (const key in single_actors) {
        if ((single_actors[key] >= threshhold) & (single_actors[key] < 100)){
            sa.push( {"name": key, "count": single_actors[key]}  );
        }

    }
    var da = [];
    for (const key in actor_pairs) {
        const keys = key.split(",")
        if ((single_actors[keys[0]] >= threshhold) & (single_actors[keys[1]] >= threshhold)){
            da.push( {"source": keys[0],"target": keys[1], "count": actor_pairs[key]}  );
        }
    }
    return [sa, da];
}

drag = simulation => {

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }




function setData_three() {
    const NUM_EXAMPLES = 10;
    // TODO: Load the artists CSV file into D3 by using the d3.csv() method. Index into the filenames array
    d3.csv("../data/netflix.csv").then(function(data) {
        // TODO: Clean and strip desired amount of data for barplot
        const ap = actorPairs(data, NUM_EXAMPLES);
        const sa = ap[0];
        const da = ap[1];
        let sizeNode = d3.scaleLinear()
            .range([4, 8])
            .domain([d3.min(sa.map(d => d.count)), d3.max(sa.map(d => d.count))]);
        const links = da.map(d => Object.create(d));
        const nodes = sa.map(d => Object.create(d));


        const forceX = d3.forceX(graph_3_width/2 ).strength(0.01)
        const forceY = d3.forceY(graph_3_height/2 ).strength(0.01)

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.name))
            .force("charge", d3.forceManyBody().strength(-10))
            .force("center", d3.forceCenter(graph_3_width / 2, graph_3_height / 2))
            .force("x", forceX)
            .force("y", forceY);


        const svg = d3.select("#graph3")
            .append("svg")
            .attr("viewBox", [0, 0, graph_3_width, graph_3_height]);

        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
          .selectAll("line")
          .data(links)
          .join("line")
            .attr("stroke-width", d => 2*Math.sqrt(d.count+2));

        let color = d3.scaleOrdinal()
            .domain(sa.map(function(d) { return d["count"] }))
            .range(d3.quantize(d3.interpolateHcl("#f7350b", "#4265D3"), NUM_EXAMPLES));

        const node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
          .selectAll("circle")
          .data(nodes)
          .join("circle")
            .attr("r", function(d) { return sizeNode(d["count"]) })
            .attr("fill", function(d) { return color(d["count"]) })
            .call(drag(simulation));

        node.append("title")
            .text(d => d.name + ", " + d.count + " movies" );

        link.append("title")
            .text(d => d.target.name + " and " + d.source.name + " in " + d.count + " movies together" );


        simulation.on("tick", () => {
          link
              .attr("x1", d => d.source.x)
              .attr("y1", d => d.source.y)
              .attr("x2", d => d.target.x)
              .attr("y2", d => d.target.y);

          node
              .attr("cx", d => d.x)
              .attr("cy", d => d.y);
        });
        let title = svg.append("text")
            .attr("transform", `translate(${(graph_3_width-margin.right)/2}, ${graph_3_height-margin.bottom/2+15})`)       // HINT: Place this at the top middle edge of the graph
            .style("text-anchor", "middle")
            .style("font-size", 15);
        title.text("Actors with at least 10 Credited Movies Acting Together");
    })
}

function average(list){
    var total = 0;
    for(var i = 0; i < list.length; i++) {
        total += list[i];
    }
    var avg = total / list.length;
    return avg;
}

function countYears(data){
    const yrs = {};
    function addYr(element, val) {
        if (yrs.hasOwnProperty(element)){
            yrs[element].push(val);
        } else {
            yrs[element] = [val];
        }
    }
    data.map(item => {
        duration_str = item.duration;
        if (duration_str.substring(duration_str.length - 3, duration_str.length) === "min") {
            item.runtime = parseInt(duration_str.substring(0, duration_str.length-4));
            item.release_year = parseInt(item.release_year);

            addYr(item.release_year, item.runtime);
        }


    })
    var yrs_list = [];
    for (const key in yrs) {
        yrs_list.push( {"year": parseInt(key), "avg": average(yrs[key])}  );

    }
    return yrs_list;
}

(function() {
    // TODO: Set up SVG object with width, height and margin
    let svg = d3.select("#graph2")      // HINT: div id for div containing scatterplot
        .append("svg")
        .attr("width", graph_2_width)     // HINT: width
        .attr("height", graph_2_height)     // HINT: height
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);    // HINT: transform

    // Set up reference to tooltip
    let tooltip = d3.select("#graph2")     // HINT: div id for div containing scatterplot
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    /*
        Create tooltip as a div right underneath the SVG scatter plot.
        Initially tooltip is invisible (opacity 0). We add the tooltip class for styling.
     */



    // TODO: Load the billboard CSV file into D3 by using the d3.csv() method

    d3.csv("../data/netflix.csv").then(function(data) {
        data = countYears(data);
        // TODO: Filter the data for songs of a given artist (hard code artist name here)


        // TODO: Nest the data into groups, where a group is a given song by the artist

        /*
            HINT: The key() function is used to join the data. We want to override the default key
            function to use the artist song. This should take the form of an anonymous function
            that returns the song corresponding to a given data point.
         */

        // TODO: Get a list containing the min and max years in the filtered dataset
        let extent = d3.extent(data, function(d) { return d.year; });
        /*
            HINT: Here we introduce the d3.extent, which can be used to return the min and
            max of a dataset.

            We want to use an anonymous function that will return a parsed JavaScript date (since
            our x-axis is time). Try using Date.parse() for this.
         */

        // TODO: Create a time scale for the x axis
        let x = d3.scaleLinear()
            .domain(extent)
            .range([0, graph_2_width - margin.left - margin.right]);

        // TODO: Add x-axis label
        svg.append("g")
            .attr("transform", `translate(0, ${graph_2_height - margin.top - margin.bottom})`)       // HINT: Position this at the bottom of the graph. Make the x shift 0 and the y shift the height (adjusting for the margin)
            .call(d3.axisBottom(x));
        // HINT: Use the d3.axisBottom() to create your axis


        // TODO: Create a linear scale for the y axis
        let y = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return d.avg; })])
            .range([graph_2_height - margin.top - margin.bottom, 0])

        /*
            HINT: The domain should be an interval from 0 to the highest position a song has been on the Billboard
            The range should be the same as previous examples.
         */

        // TODO: Add y-axis label
        svg.append("g")
            .call(d3.axisLeft(y))
            .attr("reversed", false);

        // Create a list of the groups in the nested data (representing songs) in the same order

        // OPTIONAL: Adding color
        let color = d3.scaleLinear()
            .domain(d3.extent(data, function(d) { return d.avg; }))
            .range(d3.quantize(d3.interpolateHcl("#66a0e2", "#ff5c7a"), extent[1]-extent[0]));

        // Mouseover function to display the tooltip on hover
        let mouseover = function(d) {
            let color_span = `<span style="color: ${color(d.avg)};">`;
            let html = `${d.year}<br/>
                    ${color_span}${parseInt(d.avg)} mins </span><br/>
                    `;       // HINT: Display the song here

            // Show the tooltip and set the position relative to the event X and Y location
            tooltip.html(html)
                .style("left", `${(d3.event.pageX) - 20}px`)
                .style("top", `${(d3.event.pageY) - 50}px`)
                .style("box-shadow", `2px 2px 5px ${color(d.year)}`)    // OPTIONAL for students
                .transition()
                .duration(200)
                .style("opacity", 0.9)
        };

        // Mouseout function to hide the tool on exit
        let mouseout = function(d) {
            // Set opacity back to 0 to hide
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
        };

        // Creates a reference to all the scatterplot dots
        let dots = svg.selectAll("dot").data(data);
        // TODO: Render the dot elements on the DOM
        dots.enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.year); })      // HINT: Get x position by parsing the data point's date field
            .attr("cy", function (d) { return y(d.avg); })      // HINT: Get y position with the data point's position field
            .attr("r", 4)       // HINT: Define your own radius here
            .style("fill",  function(d){ return color(d.avg); })
            .on("mouseover", mouseover) // HINT: Pass in the mouseover and mouseout functions here
            .on("mouseout", mouseout);

        // Add x-axis label
        svg.append("text")
            .attr("transform", `translate(${(graph_2_width - margin.left - margin.right) / 2},
                                        ${(graph_2_height - margin.top - margin.bottom) + 30})`)       // HINT: Place this at the bottom middle edge of the graph
            .style("text-anchor", "middle")
            .text("Year");

        // Add y-axis label
        svg.append("text")
            .attr("transform", `translate(-80, ${(graph_2_height - margin.top - margin.bottom) / 2})`)       // HINT: Place this at the center left edge of the graph
            .style("text-anchor", "middle")
            .text("Average Runtime");

        // Add chart title
        svg.append("text")
            .attr("transform", `translate(${(graph_2_width - margin.left - margin.right) / 2}, ${-20})`)       // HINT: Place this at the top middle edge of the graph
            .style("text-anchor", "middle")
            .style("font-size", 15)
            .text(`Avergae Runtime of Movies by Year`);


    });



    /**
     * Filters the given data to only include songs by the given artist
     */
    function filterData(data, artist) {
        return data.filter(function(a) { return a.artist === (artist); });
    }
})();

setData()
setData_three()
