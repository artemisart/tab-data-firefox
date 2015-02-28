var data = {
	labels: [],
	datasets: []
};


/*
 * Event listeners
 */
document.getElementById('memoryTrackingPref').addEventListener("change", function (event) {

	if (document.getElementById('memoryTrackingPref').checked) {

		addon.port.emit("memoryTrackingSetting", true);
		document.getElementById('memoryIntervalPref').disabled = false;
		document.getElementById('memoryUsageOnTabTitlesPref').disabled = false;
		document.getElementById('memoryUrlInUsage').disabled = false;

	} else {

		addon.port.emit("memoryTrackingSetting", false);
		document.getElementById('memoryIntervalPref').disabled = true;
		document.getElementById('memoryUsageOnTabTitlesPref').disabled = true;
		document.getElementById('memoryUrlInUsage').disabled = true;

		document.getElementById("memoryDump").textContent = '';
	}
}, false);

document.getElementById('memoryIntervalPref').onkeyup = function (event) {

	if (document.getElementById('memoryIntervalPref').value >= 1) {

		addon.port.emit("memoryIntervalSetting", document.getElementById('memoryIntervalPref').value);
		document.getElementById('memoryIntervalPref').className = 'green';

	} else {

		document.getElementById('memoryIntervalPref').className = 'red';
	}
};

document.getElementById('memoryFormat').addEventListener("change", function (event) {

	addon.port.emit("memoryFormatSetting", document.getElementById('memoryFormat').value);
}, false);

document.getElementById('memoryUsageOnTabTitlesPref').addEventListener("change", function (event) {

	addon.port.emit("memoryUsageOnTabTitlesSetting", document.getElementById('memoryUsageOnTabTitlesPref').value);
}, false);

document.getElementById('memoryUrlInUsage').addEventListener("change", function (event) {

	addon.port.emit("memoryUrlInUsageSetting", document.getElementById('memoryUrlInUsage').checked);
}, false);

/*document.getElementById('memoryCautionThresholdPref').onkeyup = function (event) {

	if (parseInt(document.getElementById('memoryCautionThresholdPref').value) >= 0) {

		self.port.emit("memoryCautionThresholdSetting", document.getElementById('memoryCautionThresholdPref').value);
		document.getElementById('memoryCautionThresholdPref').className = 'green';

	} else {

		document.getElementById('memoryCautionThresholdPref').className = 'red';
	}
};

document.getElementById('memoryCautionColorPref').onkeyup = function (event) {
	self.port.emit("memoryCautionColorPrefSetting", document.getElementById('memoryCautionColorPref').value);
};*/

document.getElementById('schedulePreciseGC').addEventListener("click", function (event) {
	document.getElementById('schedulePreciseGC').disabled = true;
	addon.port.emit("schedulePreciseGC", '');
}, false);



/*
 * Listen for add-on messages
 */
addon.port.on("stats", function (stats) {
	var parsedStats = JSON.parse(stats);

	document.getElementById("globalCount").value = parsedStats.globalCount;
	document.getElementById("sessionCount").value = parsedStats.sessionCount;
	document.getElementById("currentCount").value = parsedStats.currentCount;
	document.getElementById("memoryTrackingPref").checked = parsedStats.memoryTracking;
	document.getElementById("memoryIntervalPref").value = parsedStats.memoryInterval;
	document.getElementById("memoryUsageOnTabTitlesPref").value = parsedStats.memoryUsageOnTabTitles;
	document.getElementById("memoryFormat").value = parsedStats.memoryFormat;
	document.getElementById("memoryUrlInUsage").checked = parsedStats.memoryUrlInUsage;
	//document.getElementById("memoryCautionThresholdPref").value = parsedStats.memoryCautionThreshold;
	//document.getElementById("memoryCautionColorPref").value = parsedStats.memoryCautionColor;
});

addon.port.on("memoryDump", function (value) {

	var dump = JSON.parse(value).memoryDump;
	var graphData = JSON.parse(value).graphData;
	document.getElementById("memoryDump").textContent = '';

	updateCanvas(JSON.parse(graphData));

	if (parseInt(document.getElementById('memoryFormat').value) === 0) { // JSON

		var pre = document.createElement('pre');

		if (!document.getElementById("memoryUrlInUsage").checked) { // remove Url from each object

			for (var i = 0; i < dump.length; i++) {
				delete dump[i].Url;
			}
		}

		try {

			document.getElementById("memoryDump").appendChild(pre);

			var highlightedJson = syntaxHighlight(JSON.stringify(dump, undefined, 4)),
				range = document.createRange();

			range.selectNode(pre);
			var docFrag = range.createContextualFragment(highlightedJson);

			pre.appendChild(docFrag);

		} catch (e) {
			pre.appendChild(document.createTextNode('Error'));
			document.getElementById("memoryDump").appendChild(pre);
		}

	} else { // Plain

		for (var j = 0; j < dump.length; j++) {

			var string = dump[j].Memory + ': ' + dump[j].Title;

			if (document.getElementById("memoryUrlInUsage").checked) {
				string += ': ' + dump[j].Url;
			}

			document.getElementById("memoryDump").appendChild(document.createTextNode(string));
			document.getElementById("memoryDump").appendChild(document.createElement('br'));
		}
	}
});

addon.port.on("schedulePreciseGC", function (value) {
	document.getElementById('schedulePreciseGCStatus').textContent = value;
	document.getElementById('schedulePreciseGC').disabled = false;
	setTimeout(function () {
		document.getElementById('schedulePreciseGCStatus').textContent = '';
	}, 5000);
});


//Taken from: http://stackoverflow.com/a/7220510
function syntaxHighlight(json) {

	var jsonElements;

	json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {

		var cls = 'number';
		if (/^"/.test(match)) {
			if (/:$/.test(match)) {
				cls = 'key';
			} else {
				cls = 'string';
			}
		} else if (/true|false/.test(match)) {
			cls = 'boolean';
		} else if (/null/.test(match)) {
			cls = 'null';
		}
		return '<span class="' + cls + '">' + match + '</span>';
	});
}

function updateCanvas(graphData) {
	myNewChart = new Chart(document.getElementById("canvas").getContext("2d")).Line(
		graphData, {
			animation: false,
			showTooltips: false,
			responsive: false
		});
}
