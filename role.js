
   function main(config) {
     if (!config["proxy-groups"]) {
       config["proxy-groups"] = [];
     }

     var videoGroup = {
       name: "视频",
       type: "url-test",
       url: "http://www.gstatic.com/generate_204",
       interval: 300,
       proxies: ["Hysteria2"]
     };

     var found = false;
     for (var i = 0; i < config["proxy-groups"].length; i++) {
       if (config["proxy-groups"][i].name === "视频") {
         config["proxy-groups"][i] = videoGroup;
         found = true;
         break;
       }
     }
     if (!found) {
       config["proxy-groups"].push(videoGroup);
     }

     var customRules = [
       "GEOSITE,meta,go-cf",
       "GEOSITE,tiktok,go-cf",
       "DOMAIN-KEYWORD,av,视频",
       "DOMAIN,dl.google.com,🚀 节点选择",
       "GEOSITE,openai,go-cf",
       "GEOSITE,google-deepmind,go-cf",
       "DOMAIN-SUFFIX,yfsp.tv,视频",
       "DOMAIN,ip.sb,🚀 节点选择",
       "DOMAIN-KEYWORD,aistudio,🚀 节点选择",
       "DOMAIN-KEYWORD,seagm,DIRECT",
       "DOMAIN-KEYWORD,caiyunapp,DIRECT",
       "DOMAIN-KEYWORD,py1080p,DIRECT",
       "DOMAIN-KEYWORD,ad,🚀 节点选择",
       "DOMAIN,ghproxy.net,DIRECT",
       "DOMAIN-KEYWORD,missav,🚀 节点选择",
       "DOMAIN,analytics.google.com,🚀 节点选择",
       "DOMAIN,vscjava.gallery.vsassets.io,🚀 节点选择",
       "DOMAIN,ads.google.com,🚀 节点选择",
       "DOMAIN-SUFFIX,immersivetranslate.com,vless-reality-clone"
     ];

     if (!config["rules"]) {
       config["rules"] = [];
     }

     var filteredRules = [];
     for (var j = 0; j < config["rules"].length; j++) {
       var r = config["rules"][j];
       if (customRules.indexOf(r) === -1) {
         filteredRules.push(r);
       }
     }

     config["rules"] = customRules.concat(filteredRules);
     return config;
   }
