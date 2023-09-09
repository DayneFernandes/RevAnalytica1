import React, { useState, useEffect, useRef } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import moment from 'moment';
import './App.css';
import 'chartjs-plugin-datalabels';
import Chart from 'chart.js/auto';

Chart.register(ChartDataLabels);



function parseCustomDate(dateStr) {
  let month, day, year;
  if (dateStr.length === 7) { // MDDYYYY
      month = dateStr.substring(0, 1);
      day = dateStr.substring(1, 3);
      year = dateStr.substring(3, 7);
  } else if (dateStr.length === 8) { // MMDDYYYY
      month = dateStr.substring(0, 2);
      day = dateStr.substring(2, 4);
      year = dateStr.substring(4, 8);
  } else {
      return null; // Invalid format
  }
  return moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
}

export default function App() {
  const [data, setData] = useState([]);
  const [eligibleHotels, setEligibleHotels] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectAll, setSelectAll] = useState(true); 
  const [marketShareData, setMarketShareData] = useState([]);
  const doughnutRef = useRef(null);
  const [legendHtml, setLegendHtml] = useState(null);
  const [occupancyData, setOccupancyData] = useState([]);

  useEffect(() => {
    fetch('https://www.mfamanagement.co.in/eligible_hotels')
      .then(response => response.json())
      .then(hotels => {
        setEligibleHotels(hotels.sort());
        setSelectedHotels(hotels);
      })
      .catch(error => console.error("Error fetching eligible hotels:", error));
  }, []);

  useEffect(() => {
    fetchMarketGraphData();
  }, [selectedHotels]);

  useEffect(() => {
    // Fetch day-to-day occupancy data
    fetch('https://summerville.pythonanywhere.com/daily_occupancy')
      .then(response => response.json())
      .then(data => {
        setOccupancyData(data);
      })
      .catch(error => console.error("Error fetching occupancy data:", error));
  }, []);


  const fetchMarketGraphData = () => {
    const hotelsString = selectedHotels.join('|');
    fetch(`https://www.mfamanagement.co.in/market_graph1?hotels=${hotelsString}`)
      .then(response => response.json())
      .then(fetchedData => {
        setData(fetchedData);
        console.log("Hotels data for the bar chart:", fetchedData);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  };

  useEffect(() => {
    fetch('https://summerville.pythonanywhere.com/get_market_share')
        .then(response => response.json())
        .then(data => {
            setMarketShareData(data);
        })
        .catch(error => console.error("Error fetching market share data:", error));
  }, []);

  const occupancyPercentages = occupancyData.map(d => d.Occupancy);
  const occupancyDates = occupancyData.map(d => parseCustomDate(d.Date.toString()).format('YYYY-MM-DD'));




  const generateDoughnutChartData = () => {
    const totalReviews = Object.values(marketShareData).reduce((acc, val) => acc + val, 0);
    const sortedHotels = Object.entries(marketShareData)
        .map(([hotel, count]) => [hotel, (count / totalReviews) * 100])
        .sort((a, b) => b[1] - a[1]);

    const topHotels = [];
    const topHotelsData = [];
    let accumulatedPercentage = 0;
    for (let [hotel, percentage] of sortedHotels) {
        if (accumulatedPercentage < 70) {
            topHotels.push(hotel);
            topHotelsData.push(percentage);
            accumulatedPercentage += percentage;
        } else {
            break;
        }
    }
    const otherPercentage = 100 - accumulatedPercentage;
    return {
        labels: [...topHotels, 'Others'],
        datasets: [{
            data: [...topHotelsData, otherPercentage],
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)'
            ]
        }]
    };
  };

  const handleHotelSelection = (action) => {
    if (action === "selectAll") {
        setSelectedHotels(eligibleHotels);
        setSelectAll(true);
    } else if (action === "unselectAll") {
        setSelectedHotels([]);
        setSelectAll(false);
    } else {
        if (selectedHotels.includes(action)) {
            setSelectedHotels(prevHotels => prevHotels.filter(h => h !== action));
        } else {
            setSelectedHotels(prevHotels => [...prevHotels, action]);
        }
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Price Range',
        data: data.map(d => [d.min, d.max]),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        barThickness: 20,
      },
      {
        label: 'My Hotel Price',
        data: data.map(d => d.my_price),
        type: 'line',
        borderColor: 'blue',
        fill: false,
        borderDash: [5, 5],
        pointRadius: 6,
        pointBackgroundColor: 'blue'
      },
      {
        label: 'Median Price',
        data: data.map(d => d.median),
        type: 'scatter',
        borderColor: 'transparent',
        pointBorderColor: 'red',
        pointBackgroundColor: 'red',
        pointStyle: 'rectRounded',
        pointRadius: data.map(() => 7),
        fill: false,
        showLine: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: { type: 'category' },
      y: { 
        type: 'linear',
        title: {
          display: true,
          text: 'INR'
        }
      },
    },
    plugins: {
      datalabels: {
        formatter: (value, context) => `${value}%`,
        color: '#fff',
      },
      legend: {
        position: 'top',
        align: 'end', 
      },
      title: {
        display: true,
        text: 'Market Overview'
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return `Date: ${context[0].label}`;
          },
          label: function(context) {
            const dataIndex = context.dataIndex;
            const myPrice = data[dataIndex].my_price;
            const minPrice = data[dataIndex].min;
            const maxPrice = data[dataIndex].max;
            const medianPrice = data[dataIndex].median;

            switch (context.datasetIndex) {
              case 0:
                return [
                  `My Hotel Price: ${myPrice}`,
                  `Price Range: ${minPrice}-${maxPrice}`,
                  `Median Price: ${medianPrice}`
                ];
              case 1:
                return `My Hotel Price: ${myPrice}`;
              default:
                return '';
            }
          }
        }
      }
    }
  };

  return (
    <div className="app-container">
        <div className="title-container">
            <h1 className="header-title">RevAnalytica</h1>
            <div className="dropdown">
                <button onClick={toggleDropdown}>Select Hotels</button>
                {showDropdown && (
                    <div className="dropdown-content">
                        <div>
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={() => handleHotelSelection("selectAll")}
                            />
                            Select All
                        </div>
                        <div>
                            <input
                                type="checkbox"
                                checked={!selectAll}
                                onChange={() => handleHotelSelection("unselectAll")}
                            />
                            Unselect All
                        </div>
                        {eligibleHotels.map(hotel => (
                            <div key={hotel}>
                                <input
                                    type="checkbox"
                                    checked={selectedHotels.includes(hotel)}
                                    onChange={() => handleHotelSelection(hotel)}
                                />
                                {hotel}
                            </div>
                        ))}
                        <button onClick={fetchMarketGraphData}>Update Chart</button>
                    </div>
                )}
            </div>
        </div>
  
        <div className="content-container">
            <div className="chart-container">
                <div className="market-share-title">Market Share Last Week</div>
                <Doughnut
                    ref={doughnutRef}
                    className="smallDoughnut"
                    data={generateDoughnutChartData()}
                    options={{
                        plugins: {
                            datalabels: {
                                formatter: (value, context) => {
                                    const label = context.chart.data.labels[context.dataIndex];
                                    return ` ${Math.round(value)}%`;
                                },
                                color: '#000',
                                align: 'end',
                                offset: 10,
                            },
                            legend: {
                                display: false,
                            },
                        },
                    }}
                    onData={() => {
                        if (doughnutRef.current && doughnutRef.current.chartInstance) {
                            const generatedLegend = doughnutRef.current.chartInstance.generateLegend();
                            setLegendHtml(generatedLegend);
                        }
                    }}
                    onUpdate={() => {
                        if (doughnutRef.current) {
                            const generatedLegend = doughnutRef.current.chartInstance.generateLegend();
                            setLegendHtml(generatedLegend);
                        }
                    }}
                />
                <div className="scrollableLegend" dangerouslySetInnerHTML={{ __html: legendHtml }} />
                <div className="bar-chart-container">
                    <Bar
                        key={selectedHotels.join('|')}
                        data={chartData}
                        options={chartOptions}
                    />
                    <div className="occupancy-container" style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'row' }}>
                    {occupancyPercentages.map((perc, index) => (
                        <span key={index}>{perc}%</span>
                    ))}
                </div>
                </div>
            </div>
        </div>
    </div>
);


  
  

}
