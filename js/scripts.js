/*
Implementar botão de atualizar repositórios para utilizar o comando:
sudo pacman -Syy
*/
const exec = require('child_process').exec;

var apps = new Array();
var apps_installed = new Array();
function instalar(aplicativo){
	exec('xterm -e "yaourt -S '+aplicativo+' --noconfirm"',function(error,call,errlog){
		atualizar();
	});
}

function desinstalar(aplicativo){
	exec('xterm -e "yaourt -R '+aplicativo+' --noconfirm"',function(error,call,errlog){
		atualizar();
	});
}

var reinstalar = instalar;
var registros;
var apps_others = new Array();
function atualizar(){
	apps_instalados(function(){
		buscarPack($("#busca").val());
	});
}


function atualizar_todos(){
	console.log("atualizar");
	exec('xterm -e "sudo pacman -Su --noconfirm"',function(error,call,errlog){
		atualizar();
	});
}

function buscarPack(pack){
	$(".loading_svg").css("opacity","1.0");
	$(".registros").html("");
	$(".loading_svg").css("opacity","0.0");
	$(".registros").css("opacity","0.0");
	$(".sem_registros").css("opacity","0.0");
	$(".atualizar_todos").css("opacity","0.0");
	$(".atualizar_todos").css("z-index","0");
	var dados = new Array();
	if(pack=="Atualizações"){
		getAtualizacoes(function(atts){
			buscarPack(atts);
		});
		return true;
	}
	if(!Array.isArray(pack)){
		if(pack.indexOf(" ")>=0){
			var esp = " ";
			var pack1 = pack.replace(new RegExp(esp,"g"), "-");
			var pack2 = pack.replace(new RegExp(esp,"g"), "");
			registros.forEach(function(v, i) {
				if(v){
					if (v.search(new RegExp(pack1,"i")) != -1) {
			            dados.push(v);
			            return;
			        }else if (v.search(new RegExp(pack2,"i")) != -1) {
			        	dados.push(v);
			            return;
			        }
				}
			});
		}else{
			registros.forEach(function(v, i) {
				if(v){
					if (v.search(new RegExp(pack,"i")) != -1) {
			            dados.push(v);
			            return;
			        }
		    	}
			});
		}
	}else{
		dados = pack;
	}
	dados.sort();
	if(dados.length>0){
		getInfo(dados,function(info_packs){
			for(i=0;i<dados.length;i++){
				var ip_i = searchInArray(info_packs,"Name",dados[i]);
				var info_pack = info_packs[ip_i];
				var iai = searchInArray(apps_installed,"Name",dados[i]);
				if(i%3==0){
					var clone_row = $("#row_modelo").clone();
					clone_row.attr("id","");
					clone_row.show();
					clone_row.appendTo(".registros");
				}
				var clone_sm  = $("#sm_modelo").clone();
				clone_sm.attr("id","");
				if(info_pack){
					if(!info_pack.Popularity){
						clone_sm.find(".panel-heading").html(dados[i]+"<br><span class='label label-success'>"+info_pack.Version+"</span>&nbsp;<span class='label label-info'>"+info_pack.Repo+"</span>");
					}else{
						clone_sm.find(".panel-heading").html(dados[i]+"<br><span class='label label-success'>"+info_pack.Version+"</span>&nbsp;<span class='label label-info'>"+info_pack.Repo+"</span>&nbsp;<span class='label label-default'><span class='glyphicon glyphicon-star' aria-hidden='true'></span>"+info_pack.Popularity+"</span>");
					}
				}else{
					clone_sm.find(".panel-heading").html(dados[i]);
				}

				if(iai){
					clone_sm.find(".instalar_btn").hide();
					clone_sm.find(".reinstalar_btn").show();
					clone_sm.find(".desinstalar_btn").show();
					if(apps_installed[iai].Version){
						if(info_pack){
							console.log(info_pack.Version+" - "+apps_installed[iai].Version);
							if(apps_installed[iai].Version!=info_pack.Version){
								clone_sm.find(".reinstalar_btn").html("Atualizar");
							}	
						}
					}
					clone_sm.find(".reinstalar_btn").attr("onclick","reinstalar('"+dados[i]+"')");	
					clone_sm.find(".desinstalar_btn").attr("onclick","desinstalar('"+dados[i]+"')");
				}else{
					clone_sm.find(".reinstalar_btn").hide();
					clone_sm.find(".desinstalar_btn").hide();
					clone_sm.find(".instalar_btn").show();
					clone_sm.find(".instalar_btn").attr("onclick","instalar('"+dados[i]+"')");
				}
				clone_sm.show();
				clone_sm.appendTo(".row:last");
			}
			if(Array.isArray(pack)){
				$(".registros").addClass("registros_atualizar");
				$(".atualizar_todos").css("z-index","9999");	
				$(".atualizar_todos").css("opacity","1.0");
			}else{
				$(".registros").removeClass("registros_atualizar");
			}
			$(".registros").css("opacity","1.0");
		});
	}else{
		$(".sem_registros").css("opacity","1.0");
	}
}

function apps_instalados(retorno){
	exec('pacman -Q > apps_instalados.txt',null,function(error,call,errlog){
		$.ajax({
		  url: "apps_instalados.txt",
		  method: "GET"
		}).done(function(dados){
			apps_installed = new Array();
			var instalados = dados.split("\n");
			instalados.forEach(function(v, i) {
				var app_array =	v.split(" ");
				var app_installed = {
					"Name": app_array[0],
					"Version": app_array[1]
				};
				apps_installed.push(app_installed);
			});
			if(retorno){
				retorno();
			}
		});
	});
}

function getAppsRep(retorno){
	exec('pacman -Sl > apps.txt',null,function(error,call,errlog){
		$.ajax({
		  url: "apps.txt",
		  method: "GET"
		}).done(function(dados){
			apps = new Array();
			var apps_repo = dados.split("\n");
			apps_repo.forEach(function(v, i) {
				var app_array =	v.split(" ");
				var app_other = {
					"Repo": app_array[0],
					"Name": app_array[1],
					"Version": app_array[2]
				};
				apps_others.push(app_other);
				apps.push(app_array[1]);
			});
			$.ajax({
			  url: "https://aur.archlinux.org/packages.gz",
			  method: "GET"
			}).done(function(dados){
				apps_2 = dados.split("\n");
				delete apps_2[0];
				retorno(apps.concat(apps_2));
			});
		});
	});
}

function getAtualizacoes(retorno){
	exec('pacman -Qu > atualizacoes.txt',null,function(error,call,errlog){
		$.ajax({
		  url: "atualizacoes.txt",
		  method: "GET"
		}).done(function(dados){
			var new_atts = new Array();
			var atts = dados.split("\n");
			atts.forEach(function(v, i) {
				var att_arr = v.split(" ");
				if(att_arr[0]){
					new_atts.push(att_arr[0]);
				}
			});
			retorno(new_atts);
		});
	});
}

function searchInArray(cadeia,chave,valor){
	for(var i = 0; i < cadeia.length; i++) {
	   if(cadeia[i][chave] == valor) {
	     return i;
	   }
	}
}

function getInfo(pacotes,retorno){
	$.ajax({
	  url: "https://aur.archlinux.org/rpc/",
	  method: "GET",
	  data:{
	  	v: '5',
	  	type: 'info',
	  	arg: pacotes
	  }
	}).done(function(dados){
		var dados_2 = new Array();
		for(i=0;i<pacotes.length;i++){
			var i_arr = searchInArray(apps_others,"Name",pacotes[i]);
			if(i_arr){
				dados_2.push(apps_others[i_arr]);
			}
		}
		if(dados){
			dados = dados.results;
			dados.forEach(function(v, i) {
				dados[i].Repo = "AUR";
			});
			if(dados_2){
				dados = dados.concat(dados_2);
			}
		}else{
			dados = dados_2;
		}
		retorno(dados);
	});
}

function ver_atualizacoes(){
	$("#busca").val("Atualizações");
	$("#busca").keyup();
}

var tray = new nw.Tray({
	title: 'Pacaum',
	icon: 'images/down-icon.png',
	tooltip: 'Abrir e verificar atualizações'
});
var win = nw.Window.get();

tray.on("click",function(){
	win.show();
	getAtualizacoes(function(atts){
		if(atts.length>0){
			ver_atualizacoes();
		}
	});
});

$(document).ready(function(){

	var valor,valor_anterior,zero_length;
	

	apps_instalados(function(){
		getAppsRep(function(dados){
			getAtualizacoes(function(atts){
				registros = dados;
				console.log(registros);

				$(".loading_svg").css("opacity","0.0");
				$("#busca").css("opacity","1.0");
				$(".imagem_aur").css("opacity","1.0");
				if(atts.length>0){
					$(".atualizacoes_disponiveis").html(String(atts.length)+" Atualizações Disponíveis");
					$(".atualizacoes_disponiveis").css("opacity","1.0");
				}
			});
		});
	});

	setInterval(function(){
		if(valor_anterior!=valor&&zero_length=="nao"){
			valor_anterior = valor;
			buscarPack(valor);
		}
	},3000);


	$("#busca").keyup(function(e){
		if($(this).val().length>=3){
			zero_length = "nao";
			$(this).addClass("textbox_cima");
			if(valor!=$(this).val()){
				$(".imagem_aur").addClass("imagem_aur_hide");
				$(".atualizacoes_disponiveis").addClass("atualizacoes_disponiveis_hide");
				$(".registros").html("");
				$(".registros").css("opacity","0.0");
				$(".loading_svg").css("opacity","1.0");
		 		$(".sem_registros").css("opacity","0.0");
		 		$(".atualizar_todos").css("opacity","0.0");
		 		$(".atualizar_todos").css("z-index","0");
				valor = $(this).val();
			}	
		}else{
			zero_length = "sim";
			$(this).removeClass("textbox_cima_hide");
			$(this).removeClass("textbox_cima");
			$(".imagem_aur").removeClass("imagem_aur_hide");
			$(".atualizacoes_disponiveis").removeClass("atualizacoes_disponiveis_hide");
			$(".registros").html("");
			$(".loading_svg").css("opacity","0.0");
			$(".sem_registros").css("opacity","0.0");
			$(".atualizar_todos").css("opacity","0.0");
			$(".atualizar_todos").css("z-index","0");
			$(".imagem_aur").css("opacity","1.0");
			valor_anterior = null;
		}
	});
	var scroll_anterior;
	$(document).scroll(function() {
		var scrolado =  $(document).scrollTop();
		if(scrolado>=53){
			if(scrolado>scroll_anterior){
				$(".textbox_cima").addClass("textbox_cima_hide");
			}else if(scrolado<scroll_anterior){
				$(".textbox_cima").removeClass("textbox_cima_hide");
			}
		}else{
			$(".textbox_cima").removeClass("textbox_cima_hide");
		}
		scroll_anterior= scrolado;
	});
});
