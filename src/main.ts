import open from "open";
import { Flow, JSONRPCResponse } from "./lib/flow";
import { z } from "zod";
import dayjs from "dayjs";
import logger from "./lib/logger";
import childProcess from "child_process";
import { getTimeZones } from "@vvo/tzdb";

// The events are the custom events that you define in the flow.on() method.
const events = ["search", "copyToClipboard"] as const;
type Events = (typeof events)[number];

const flow = new Flow<Events>("src/assets/favicon.ico");

const copy = (content: string) => childProcess.spawn("clip").stdin.end(content);


const subCommonds = ['tz']

flow.on("query", (params) => {
	const [query] = z.array(z.string()).parse(params);
 
	// logger.info("get query: " + query ); 

	if (query.length > 0) {
		const splitParams = query.split(' ')
		// logger.info("splitParams: " + splitParams.length );

		const commond = splitParams[0].toLowerCase()

		if (subCommonds.includes(commond)) {

			switch (commond) {
				case 'tz': // 时区
					const timeZones = getTimeZones({includeUtc: true});

					let showTimezoneResults: any[] = [];

					if(splitParams.length === 1)
					{
						showTimezoneResults = timeZones.slice(0, 9);
					} else {
						const keyword = splitParams.slice(1).join(' ').trim();

						if(keyword.length > 0)
						{
							showTimezoneResults = timeZones.filter(item => item.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, 9)
						}
					}

					const result: JSONRPCResponse<Events>[] = [];

					if(showTimezoneResults.length > 0) {
						showTimezoneResults.forEach((el) => {
							const timeZoneOffset = formatTimeZoneOffset(el.rawOffsetInMinutes)
							result.push({
								title: `Time Zone: ${el.name}  ${timeZoneOffset}`,
								subtitle: `Click & Copy to Clipboard`,
								method: "copyToClipboard",
								parameters: [`${el.name} ${timeZoneOffset}`],
								dontHideAfterAction: true,
							})
						});
						
					}
					
					flow.showResult(...result);
					
				  	break;
				default:
					err()
			}
			
			return;  
			
		} else {
			// 如果是整数 当时间戳来处理
			if(/^\d+$/.test(commond)) {
				// logger.info("Number: " + commond );
				let timestamp = 0;

				if(/^\d{1,10}$/.test(commond) )
				{
					timestamp = parseInt(commond) * 1000;
				} else if(/^\d{13}$/.test(commond) ) {
					timestamp = parseInt(commond);
				} else {
					err()
					return;
				}
	
				if (timestamp > 0) {
					const dj: dayjs.Dayjs = dayjs(timestamp);
	
					const datetime = dj.format('YYYY-MM-DD HH:mm:ss');
					const date = dj.format('YYYY-MM-DD');
					const time = dj.format('HH:mm:ss');
		
					flow.showResult({
						title: `Date Time: ${datetime}`,
						subtitle: `Click & Copy to Clipboard`,
						method: "copyToClipboard",
						parameters: [`${datetime}`],
						dontHideAfterAction: true,
					}, {
						title: `Date: ${date}`,
						subtitle: `Click & Copy to Clipboard`,
						method: "copyToClipboard",
						parameters: [`${date}`],
						dontHideAfterAction: true,
					}, {
						title: `Time: ${time}`,
						subtitle: `Click & Copy to Clipboard`,
						method: "copyToClipboard",
						parameters: [`${time}`],
						dontHideAfterAction: true,
					});
					return;
				}
			} else {
				const dj: dayjs.Dayjs = dayjs(query);

				const timestamp = dj.unix();
				const timestampMilli = dj.valueOf();

				flow.showResult({
					title: `Timestamp: ${timestamp}`,
					subtitle: `Click & Copy to Clipboard`,
					method: "copyToClipboard",
					parameters: [`${timestamp}`],
					dontHideAfterAction: true,
				}, {
					title: `Timestamp(milli): ${timestampMilli}`,
					subtitle: `Click & Copy to Clipboard`,
					method: "copyToClipboard",
					parameters: [`${timestampMilli}`],
					dontHideAfterAction: true,
				});
				return;
			}

		}

	} else {
		defaultResult();
		return;
	}

	defaultResult();
});

function err()
{
	flow.showResult( {
		title: `Err input`,
		subtitle: ``,
		dontHideAfterAction: true
	});
}

function formatTimeZoneOffset(offsetMinutes: number) {
	// 计算小时部分
	const hours = Math.floor(offsetMinutes / 60);
  
	// 计算分钟部分
	const minutes = offsetMinutes % 60;
  
	// 确定时区的方向（正负号）
	const sign = offsetMinutes >= 0 ? '+' : '-';
  
	// 格式化为 "-hh:mm" 形式
	const formattedOffset = `${sign}${Math.abs(hours).toString().padStart(2, '0')}:${Math.abs(minutes).toString().padStart(2, '0')}`;
  
	return formattedOffset;
  }
  


function defaultResult()
{
	const dj: dayjs.Dayjs = dayjs();
	const timestamp = dj.unix();
	const timestampMilli = dj.valueOf();
	const datetime = dj.format('YYYY-MM-DD HH:mm:ss');
	const date = dj.format('YYYY-MM-DD');
	const time = dj.format('HH:mm:ss');
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	flow.showResult({
		title: `Timestamp: ${timestamp}`,
		subtitle: `Click & Copy to Clipboard`,
		method: "copyToClipboard",
		parameters: [`${timestamp}`],
		dontHideAfterAction: true,
	}, {
		title: `Timestamp(milli): ${timestampMilli}`,
		subtitle: `Click & Copy to Clipboard`,
		method: "copyToClipboard",
		parameters: [`${timestampMilli}`],
		dontHideAfterAction: true,
	}, {
		title: `Date Time: ${datetime}`,
		subtitle: `Click & Copy to Clipboard`,
		method: "copyToClipboard",
		parameters: [`${datetime}`],
		dontHideAfterAction: true,
	}, {
		title: `Date: ${date}`,
		subtitle: `Click & Copy to Clipboard`,
		method: "copyToClipboard",
		parameters: [`${date}`],
		dontHideAfterAction: true,
	}, {
		title: `Time: ${time}`,
		subtitle: `Click & Copy to Clipboard`,
		method: "copyToClipboard",
		parameters: [`${time}`],
		dontHideAfterAction: true,
	}, {
		title: `TimeZone: ${timeZone}`,
		subtitle: `Click & Copy to Clipboard`,
		method: "copyToClipboard",
		parameters: [`${timeZone}`],
		dontHideAfterAction: true,
	});

	return;
}

// 复制到粘贴板
flow.on("copyToClipboard", (parameters) => {
	copy(`${parameters[0]}`)
	// logger.info("copyToClipboard: " + parameters[0] );
});

flow.on("search", (params) => {
	const [url] = z.array(z.string().url()).parse(params);
	open(url);
});

flow.run();
