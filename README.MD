# Quake Severity
[![ScreenShot](https://github.com/davidcooper1/QuakeSeverity/blob/master/screenshot.PNG)](https://youtu.be/Mi3jZggjw6c)
Click on the above screenshot to be redirected to the video, or if you are unable, click [here](https://youtu.be/Mi3jZggjw6c).

[--------------------------------------------------CLICK HERE FOR PROJECT--------------------------------------------------------](https://davidcooper1.github.io/QuakeSeverity/)

## The Challenge

Our final project was to tackle the [2019 VAST Challenge](https://vast-challenge.github.io/2019/). Our application focuses on [mini-challenge 1](https://vast-challenge.github.io/2019/MC1.html). In challenge one, the St. Hitmark (fictional) community has released a mobile application to report damages in their neighborhood. Our job is to answer a few questions. How would you prioritize neighborhoods for response? Which parts of the city are hardest hit? Which neighborhoods are providing reliable reports? How do conditions change over time? How does uncertainty in change over time? At the end of this report we will answer these questions with our observations on the data

## Libraries

The libraries used on this project consist of JQuery, sql.js, Bootstrap, and D3. We used JQuery for smooth DOM manipulation, sql.js is allowing us to query our data reliably, Bootstrap for readable UI elements, and D3 for constructing the visualizations.
The links for each can be found here:

[https://jquery.com/download/](https://jquery.com/download/).

[https://github.com/kripken/sql.js?files=1](https://github.com/kripken/sql.js?files=1).

[https://getbootstrap.com/docs/4.0/getting-started/download/](https://getbootstrap.com/docs/4.0/getting-started/download/).

[https://d3js.org/](https://d3js.org/).

## Time Series

With the data given to us by the VAST challenge, we display a "Reported Damage" line graph. Depending on the current category selected, we display the intensity of the reports for the wanted category. You can hover over the graph to specify a time. When a time is specified, all of the intensity maps on the row below will update to reports given in the chosen time frame.

## Intensity Map

There are two sets of maps for this project. The selection map allows the user to focus onto one neighborhood for the "Reported Damage" line graph. The second set of maps is a group of intensity maps that represent the density of reports in that neighborhood for each category. On both the selection map and the intensity maps, the user can hover a neighborhood to see its name.

## Tasks

Using our group of intensity maps, we would prioritize the neighborhoods with the highest intensity of reported damage on average. Based on shake intensity for example: The neighborhoods with the highest report shake intensity were all positioned in the North East sector. We would allocate first responders to those neighborhoods.

Based off of the line graph, you can visually see neighborhoods that are less reliable. These neighborhoods are very rural and have a smaller data set and are therefore less reliable.

Conditions change drastically for shake intensity. Starting early Wednesday the 8th, the average intensity report shoots from 0.1 to 3.1, being the highest it reaches during the event. Also the reliability of the data increases over time due to the increase of users in total who have downloaded the application.
