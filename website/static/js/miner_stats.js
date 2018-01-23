var workerHashrateData;
var workerHashrateChart;
var workerHistoryMax = 160;
var statData;
var poolData;
var totalHash;
var totalImmature;
var totalBal;
var totalPaid;
var totalShares;

var statpool;
var statluckpool;
var network;
var sharecountpool;
var blocksJson;
var update = false;

$.getJSON('/api/stats', function(statsSourcePOOL) {
    var stattts = statsSourcePOOL;
    statpool = (((stattts.algos.equihash.hashrate) / 1000) / 1000) * 2;
    network = stattts.pools.bitcoinz.poolStats.networkSols;
    statluckpool = (network / statpool * 152) / (24 * 60 * 60);
    sharecountpool = stattts.pools.bitcoinz.shareCount;
    netdiff = stattts.pools.bitcoinz.poolStats.networkDiff;
});

		$("#addtodash").click( function(e) {
				localStorage.vmAddress = statData.miner;
				alert("Dashboard Address Set. Redirecting to dashboard...");
				window.location.href = "/dashboard";
		});

function getReadableHashRateString(hashrate) {
    hashrate = (hashrate * 2);
    if (hashrate < 1000000) {
        return (Math.round(hashrate / 1000) / 1000).toFixed(2) + ' Sol/s';
    }
    var byteUnits = [' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s'];
    var i = Math.floor((Math.log(hashrate / 1000) / Math.log(1000)) - 1);
    hashrate = (hashrate / 1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2) + byteUnits[i];
}
function timeOfDayFormat(timestamp) {
    var dStr = d3.time.format('%I:%M %p')(new Date(timestamp));
    if (dStr.indexOf('0') === 0)
        dStr = dStr.slice(1);
    return dStr;
}

function getWorkerNameFromAddress(w) {
	var worker = w;
	if(w.includes("<script")){
		return;
	} else if (w.split(".").length > 1) {
		worker = w.split(".")[1];
		if (worker == null || worker.length < 1) {
			worker = "noname";
		}
	} else {
		worker = "noname";
	}
	return worker;
}

function buildChartData() {
    var workers = {};
    for (var w in statData.history) {
        var worker = getWorkerNameFromAddress(w);
		if(worker == null){
			continue;
		}
        var a = workers[worker] = (workers[worker] || {
            hashrate: []
        });
        for (var wh in statData.history[w]) {
            a.hashrate.push([statData.history[w][wh].time * 1000, statData.history[w][wh].hashrate]);
        }
        if (a.hashrate.length > workerHistoryMax) {
            workerHistoryMax = a.hashrate.length;
        }
    }
    var i = 0;
    workerHashrateData = [];
    for (var worker in workers) {
		if(worker == "undefined"){
			continue;
		}
        workerHashrateData.push({
            key: worker,
            disabled: (i > Math.min((_workerCount - 1), 3)),
            values: workers[worker].hashrate
        });
        i++;
    }
}
function updateChartData() {
    var workers = {};
    for (var w in statData.history) {
        var worker = getWorkerNameFromAddress(w);
		if(worker == null){
			continue;
		}
        for (var wh in statData.history[w]) {}
        var foundWorker = false;
        for (var i = 0; i < workerHashrateData.length; i++) {
            if (workerHashrateData[i].key === worker) {
                foundWorker = true;
                if (workerHashrateData[i].values.length >= workerHistoryMax) {
                    workerHashrateData[i].values.shift();
                }
                workerHashrateData[i].values.push([statData.history[w][wh].time * 1000, statData.history[w][wh].hashrate]);
                break;
            }
        }
        if (!foundWorker) {
            var hashrate = [];
            hashrate.push([statData.history[w][wh].time * 1000, statData.history[w][wh].hashrate]);
            workerHashrateData.push({
                key: worker,
                values: hashrate
            });
            rebuildWorkerDisplay();
            return true;
        }
    }
    triggerChartUpdates();
    return false;
}
function calculateAverageHashrate(worker) {
    var count = 0;
    var total = 1;
    var avg = 0;
    for (var i = 0; i < workerHashrateData.length; i++) {
        count = 0;
        for (var ii = 0; ii < workerHashrateData[i].values.length; ii++) {
            if (worker == null || workerHashrateData[i].key === worker) {
                count++;
                avg += parseFloat(workerHashrateData[i].values[ii][1]);
            }
        }
        if (count > total)
            total = count;
    }
    avg = avg / total;
    return avg;
}
function triggerChartUpdates() {
    workerHashrateChart.update();
}
function displayCharts() {
    nv.addGraph(function() {
        for (var i in workerHashrateData) {
            workerHashrateData[i].disabled = false;
        }
        workerHashrateChart = nv.models.lineChart().margin({
            left: 80,
            right: 15
        }).x(function(d) {
            return d[0]
        }).y(function(d) {
            return d[1]
        }).useInteractiveGuideline(true).clipEdge(true);
        workerHashrateChart.xAxis.showMaxMin(false).tickFormat(timeOfDayFormat);
        workerHashrateChart.yAxis.tickFormat(function(d) {
            return getReadableHashRateString(d);
        });
        d3.select('#workerHashrate').datum(workerHashrateData).transition().duration(500).call(workerHashrateChart);
        return workerHashrateChart;
    });
}
function updateStats() {
    totalHash = statData.totalHash;
    totalPaid = statData.paid;
    totalBal = statData.balance;
    totalImmature = statData.immature;
    var _blocktime = 250;
    var _networkHashRate = parseFloat(statData.networkSols) * 1.2;
    var _myHashRate = (totalHash / 1000000) * 2;
    var luckDays = ((_networkHashRate / _myHashRate * _blocktime) / (24 * 60 * 60)).toFixed(3);
    $("#statsHashrate").text(getReadableHashRateString(totalHash));
    $("#statsHashrateAvg").text(getReadableHashRateString(calculateAverageHashrate(null)));
    $("#statsLuckDays").text(luckDays);
    $("#statsTotalImmature").text(totalImmature);
    $("#statsTotalBal").text(totalBal);
    $("#statsTotalPaid").text(totalPaid);
    var totalShares = statData.totalShares;
    var estimatedCoins = 0;
    totalShares = totalShares.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    $("#statsTotalShares").text(totalShares);

}

function updateWorkerStats() {
    var i = 0;
    for (var w in statData.workers) {
        i++;
        var htmlSafeWorkerName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
        var saneWorkerName = getWorkerNameFromAddress(w);
				if(saneWorkerName == null){
			continue;
		}
        $("#statsHashrate" + htmlSafeWorkerName).text(getReadableHashRateString(statData.workers[w].hashrate));
        $("#statsHashrateAvg" + htmlSafeWorkerName).text(getReadableHashRateString(calculateAverageHashrate(saneWorkerName)));
        $("#statsLuckDays" + htmlSafeWorkerName).text(statData.workers[w].luckDays);
        $("#statsPaid" + htmlSafeWorkerName).text(statData.workers[w].paid);
        $("#statsBalance" + htmlSafeWorkerName).text(statData.workers[w].balance);
        $("#statsShares" + htmlSafeWorkerName).text(Math.round(statData.workers[w].currRoundShares * 100) / 100);
        $("#statsDiff" + htmlSafeWorkerName).text(statData.workers[w].diff);
    }
}

function addWorkerToDisplay(name, htmlSafeName, workerObj) {
	var htmlToAdd = "";
	 
	
    htmlToAdd += '<div class="col-md-2"><div class="card"><div class="card-header h5" style="background:#343a40;color:white; font-size:14px">' + name + '</div><div class="card-block">';
    htmlToAdd += '<p><i class="fa fa-tachometer"></i> <span id="statsHashrate' + htmlSafeName + '">' + getReadableHashRateString(workerObj.hashrate) + '</span> (Now)</p>';
    htmlToAdd += '<p><i class="fa fa-tachometer"></i> <span id="statsHashrateAvg' + htmlSafeName + '">' + getReadableHashRateString(calculateAverageHashrate(name)) + '</span> (Avg)</p>';
    htmlToAdd += '<p><i class="fa fa-shield"></i> <small>Diff:</small> <span id="statsDiff' + htmlSafeName + '">' + workerObj.diff + '</span></p>';
    htmlToAdd += '<p><i class="fa fa-cog"></i> <small>Shares:</small> <span id="statsShares' + htmlSafeName + '">' + (Math.round(workerObj.currRoundShares * 100) / 100) + '</span></p>';
    htmlToAdd += '<p><i class="fa fa-gavel"></i> <small>Luck <span id="statsLuckDays' + htmlSafeName + '">' + workerObj.luckDays + '</span> Days</small></p>';
    htmlToAdd += '<p><i class="fa fa-money"></i> <small>Bal: <span id="statsBalance' + htmlSafeName + '">' + workerObj.balance + '</span></small></p>';
    htmlToAdd += '<p><i class="fa fa-money"></i> <small>Paid: <span id="statsPaid' + htmlSafeName + '">' + workerObj.paid + '</span></small></p></div></div></div>';
    return htmlToAdd;

	
}

function objectLength(obj) {
  var result = 0;
  for(var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
    // or Object.prototype.hasOwnProperty.call(obj, prop)
      result++;
    }
  }
  return result;
}

function toStandardizedDate(epoch) {
	var utcDate = new Date(epoch);
    return utcDate.toLocaleString();
}

function paymentList(update) {
		var x = 0
	
		
		$(function () {
  $('[data-toggle="tooltip"]').tooltip({
    container : 'body'
  });
});
    var htmlpayadd = "";
	var prehtmlpayadd = ""
							for(var i in workerPaymentJson){
									for(var block in workerPaymentJson[i].pending.blocks){
									if(!block){return}
								var pendingBlockFinder = workerPaymentJson[i].pending.blocks[block].split(":")[3].split(".")[0]
								var date = parseInt(workerPaymentJson[i].pending.blocks[block].split(":")[4]);
								var txid = workerPaymentJson[i].pending.blocks[block].split(":")[1];
								var blockid = workerPaymentJson[i].pending.blocks[block].split(":")[2];
								var hex = workerPaymentJson[i].pending.blocks[block].split(":")[0];
								var confirms = workerPaymentJson[i].pending.confirms[hex];
					if(!update){
                    prehtmlpayadd += '<tr>';
                    prehtmlpayadd += '<td>' + toStandardizedDate(date) + '</td>';
                    prehtmlpayadd += '<td><a href="https://explorer.bitcoinz.site/tx/' + txid + '" title="View transaction" target="_blank"> ' + blockid + '</a></td>';
					if(pendingBlockFinder == _miner){
					prehtmlpayadd += '<td data-toggle="tooltip" data-placement="top" data-container="body" title = "You discovered this PENDING block and will be paid an extra 1000 BTCZ after block confirmation" style="color:green;"><span style="color:red;"><i class="fa fa-money fa-spin" style="color:green"></i>&nbsp;' + '<span id="' + blockid + '-confirms">' + confirms + '</span> of 100 Confirmations</span>&nbsp;';
					} else {
						prehtmlpayadd += '<td><span style="color:red;"><i class="fa fa-spinner fa-spin"></i>&nbsp;' + '<span id="' + blockid + '-confirms">' + confirms + '</span> of 100 Confirmations</span>';
					}
					htmlpayadd += '</tr>';
					} else {
							
						$("#" + blockid + "-confirms").text(confirms);
						
					}
									}
							}
							if(!update){
							htmlpayadd += prehtmlpayadd;
							}
							
							
							
	
	
    for (var i in workerPaymentJson) {		
        for (var p in workerPaymentJson[i].payments) {
            for (var t in workerPaymentJson[i].payments[p].amounts) {
				
                if (t.startsWith(_miner)) {
					if(x < 5){
					
						var paidBlock = "";
						
													var blockNum = workerPaymentJson[i].payments[p].blocks;
							if(blocksJson && blockNum){
								getBlockInfo = blocksJson['bitcoinz-'+blockNum];
								if(getBlockInfo){
								paidBlock = getBlockInfo.split(":")[3].split(".")[0];
								}
							}
				if(!update){
                    htmlpayadd += '<tr>';
                    htmlpayadd += '<td>' + toStandardizedDate(workerPaymentJson[i].payments[p].time) + '</td>';
                    htmlpayadd += '<td><a href="https://explorer.bitcoinz.site/tx/' + workerPaymentJson[i].payments[p].txid + '" title="View transaction" target="_blank"> ' + blockNum + '</a></td>';
					if(paidBlock == _miner){
					htmlpayadd += '<td data-toggle="tooltip" data-placement="top" data-container="body" title = "You discovered this block and were paid an extra 1000 BTCZ" style="color:green; font-weight:bold;"><i class="fa fa-money"></i>&nbsp;' + (workerPaymentJson[i].payments[p].amounts[t]).toFixed(4) + ' Bitcoinz</td>';
					} else {
                    htmlpayadd += '<td>' + (workerPaymentJson[i].payments[p].amounts[t]).toFixed(4) + ' Bitcoinz</td>';
					}
                    htmlpayadd += '</tr>';
					x++
                } else {
					
				}
					}
				}
            }
        }
    }
    $("#paymentlist tbody").append(htmlpayadd);
}

function rebuildWorkerDisplay() {
	$("#boxesWorkers").html("");
	var html = '';
    var i = 0;
	var rowcount = 0;
	var totalCount = objectLength(statData.workers);
	
    for (var w in statData.workers) {
        i++;
		rowcount++;
        var htmlSafeWorkerName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
        var saneWorkerName = getWorkerNameFromAddress(w);
		if(saneWorkerName == null){
			continue;
		}
		if(rowcount < 6){
			if(rowcount == 1){
				html += '<div class="row">'
			}
        html += addWorkerToDisplay(saneWorkerName, htmlSafeWorkerName, statData.workers[w]);
			if(rowcount == 5 || totalCount == i){
				html += '</div>'
				rowcount = 0;
			}
		}
		
		
    }
		$("#boxesWorkers").html($("#boxesWorkers").html()+html);

}
nv.utils.windowResize(triggerChartUpdates);
$.getJSON('/api/worker_stats?' + _miner, function(data) {
    delete window.statData;
    window.statData = data;
    for (var w in statData.workers) {
        _workerCount++;
    }
    buildChartData();
    displayCharts();
    rebuildWorkerDisplay();
    updateStats();
});

		$.getJSON('/api/blocks', function(data) {
			blocksJson = data;
		});
		
        $.getJSON('/api/payments', function(data) {
            workerPaymentJson = data;
            paymentList();
        });
		
				setInterval(function(){ 
		paymentList(true);
		}, 60000);	
		
		

		

		
		statsSource.addEventListener('message', function(e) {
    $.getJSON('/api/worker_stats?' + _miner, function(data) {
        statData = data;
        var wc = 0;
        var rebuilt = false;
        for (var w in statData.workers) {
            wc++;
        }
        if (_workerCount != wc) {
            if (_workerCount > wc) {
                rebuildWorkerDisplay();
                rebuilt = true;
            }
            _workerCount = wc;
        }
        rebuilt = (rebuilt || updateChartData());
        updateStats();
        if (!rebuilt) {
            updateWorkerStats();
        }
    });
    $.getJSON('/api/stats', function(data) {
        poolData = data;
    });
});

