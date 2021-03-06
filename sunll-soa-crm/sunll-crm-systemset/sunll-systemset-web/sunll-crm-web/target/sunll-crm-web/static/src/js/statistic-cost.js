var vm = new Vue({
    el: "#container",
    data: {
        pageSizeField: [10, 20, 30, 40, 50],
        //pageSizeField: [2, 4, 6, 8, 10],
        startTime: "",
        endTime: "",
        pageNum: 1,
        pageSize: 10,
        //pageSize: 2,
        pages: 0,//共多少页
        total: 50,
        checkedDepartmentId: "",
        checkedUserId: parseInt(sessionStorage.getItem("USER_TOKEN")),
        tableHead: [
            {name: '部门/人员'},
            {name: '坐席费用总计'},
            {name: '通话总时长'},
            {name: '通话时长费用总计'},
            {name: '总计（元）'},
        ],
        operate: [
            {
                "id": 0,
                "name": "",
                "totalSeatCosts": "",
                "totalCallDuration": "",
                "callDurationTotalCost": "",
                "total": ""
            },
        ],
        allTotal: [
            {totalSeatCosts: ''},
            {totalCallDuration: ''},
            {callDurationTotalCost: ''},
            {total: ''},
        ],
        statisticType: '通话费用',
        statisticTypeArr: [
            {name: '通话费用', url: '/jspSkip/statisticCost'},
            {name: '通话时长', url: '/jspSkip/statisticDuration'}
        ],
    },
    created: function () {
        //执行一个laydate实例
        let self = this;
        lay('#version').html('-v' + laydate.v);
        laydate.render({
            elem: `#date` //指定元素
            , range: true
            , done: function (value, date) {
                self.datte = value;
                $(this.elem[0]).trigger('change');
            },
        });

    },
    methods: {
        lastPage: function () {//上一页
            if (vm.pageNum > 1) {
                vm.pageNum--;
                vm.reload();
            } else {
                layer.msg("已经是第一页了",{time:2000});
            }
        },
        nextPage: function () {//下一页
            if (vm.pageNum < vm.pages) {
                vm.pageNum++;
                vm.reload();
            } else {
                layer.msg("已经是最后一页了",{time:2000});
            }
        },
        jumpPage: function () {
            if ($("#jumpPage").val() <= vm.pages) {
                vm.pageNum = $("#jumpPage").val();
                vm.reload();
            } else {
                layer.msg("没有此页",{time:2000});
            }
        },
        checkedPageSize: function (e) {
            vm.pageSize = $(e.target).val();
            vm.reload();
        },
        reload: function () {
            vm.operate = [];
            vm.allTotal = [];
            var date = $("#date").val();
            var array = ["",""];
            if(date != "" && date != null){
                var array = date.split(" - ");
            }
            $.ajax({
                url: "/call/selectTotalExpensesOther",
                type: 'POST',
                async: false,
                data: {
                    "userId":parseInt(sessionStorage.getItem("USER_TOKEN")),
                    "companyId":parseInt(sessionStorage.getItem("CRM_COMPANY_TOKEN")),
                    "startTime": array[0],
                    "endTime": array[1],
                    "PageNum": vm.pageNum,
                    "PageSize": vm.pageSize,
                    "checkedDepartmentId": vm.checkedDepartmentId,
                    "checkedUserId": vm.checkedUserId
                },
                dataType: "json",
                error: function () {
                    console.log("查询异常，请重试!")
                },
                success: function (data) {
                    console.log("调取外部接口");
                    console.log(data);
                    vm.operate = data.list;
                    vm.total = data.total;
                    vm.pages = data.pages;
                    vm.pageNum = data.pageNum;

                    $.ajax({
                        url: "/call/selectTotalExpensesTotalOther",
                        type: 'POST',
                        async: false,
                        data: {
                            "userId":parseInt(sessionStorage.getItem("USER_TOKEN")),
                            "companyId":parseInt(sessionStorage.getItem("CRM_COMPANY_TOKEN")),
                            "startTime": array[0],
                            "endTime": array[1],
                            "PageNum": vm.pageNum,
                            "PageSize": vm.pageSize,
                            "checkedDepartmentId": vm.checkedDepartmentId,
                            "checkedUserId": vm.checkedUserId
                        },
                        dataType: "json",
                        error: function () {
                            console.log("查询异常，请重试!")
                        },
                        success: function (data) {
                            console.log(data);
                            data.callDurationTotalCost=data.callDurationTotalCost.toFixed(2);
                            data.total=data.total.toFixed(2);
                            vm.allTotal = data;
                        }
                    });
                }
            });
        },
        query: function () {
            vm.reload();
        },
        sendOther: function () {
            var sendOther = layer.open({
                type: 2,
                title: false,
                closeBtn: 0,
                area: ['70%', '85%'],
                content: "/jspSkip/selectDepAndUser",
                anim: 1, btn: ['确定', '取消'],
                yes: function (index, layero) {
                    var iframeWin = window[layero.find('iframe')[0]['name']];
                    if (iframeWin.vm.peopleId != null && iframeWin.vm.peopleId != '') {
                        var length = iframeWin.vm.peopleId.length;
                        var userIds = [];
                        var departmentIds = [];
                        for (var i = 0; i < iframeWin.vm.peopleNum.length; i++) {
                            if (iframeWin.vm.peopleNum[i].id[0] == "d") {
                                var length = iframeWin.vm.peopleNum[i].id.length
                                departmentIds.push(iframeWin.vm.peopleNum[i].id.substring(1, length + 1));
                            } else {
                                userIds.push(iframeWin.vm.peopleNum[i].id)
                            }
                        }
                        if (departmentIds[0] != null) {
                            vm.checkedDepartmentId = departmentIds[0];
                            vm.checkedUserId = null;
                        } else {
                            vm.checkedDepartmentId = null;
                            vm.checkedUserId = userIds[0];
                        }
                        $("#departmentName").text(iframeWin.vm.peopleName);
                        layer.close(sendOther);
                    }
                },
                //取消
                btn2: function (index, layero) {
                }
            })
        },
        fnType: function () {
            this.statisticTypeArr.map((o) => {
                if (this.statisticType == o.name
                ) {
                    window.location.href = o.url
                }
            })
        },
        exportExcel: function () {
            var date = $("#date").val();
            var array = ["",""];
            if(date != "" && date != null){
                var array = date.split(" - ");
            }
            $("input[name='CRM_TOKEN']").val(sessionStorage.getItem("CRM_TOKEN"));
            $("input[name='userId']").val(parseInt(sessionStorage.getItem("USER_TOKEN")));
            $("input[name='companyId']").val(parseInt(sessionStorage.getItem("CRM_COMPANY_TOKEN")));
            $("input[name='startTime']").val(array[0]);
            $("input[name='endTime']").val(array[1]);
            $("input[name='PageNum']").val(vm.pageNum);
            $("input[name='PageSize']").val(vm.pageSize);
            $("input[name='checkedDepartmentId']").val(vm.checkedDepartmentId);
            $("input[name='checkedUserId']").val(vm.checkedUserId);
            $("#exf").submit();
        }
    }
});
vm.reload();
