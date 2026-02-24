$('#import').on("click", function () {
    $('#selectFiles[type=file]').trigger('click');
});

$('#export').on("click", function () { save_options(false) });

$('#selectFiles[type=file]').change(function(){
    loadFile();
});
function alertaBoxPro(status, icon, text) {
    $('#alertaBoxPro')
        .html('<strong class="alerta'+status+'Pro alertaBoxPro" style="font-size: 12pt; padding: 15px 5px 0; display: block;"><i class="fas fa-'+icon+'"></i> '+text+'</strong>')
        .dialog({
            height: "auto",
            width: "auto",
            modal: true,
            my: "center",
            at: "center",
            of: window,
            close: function() {
              location.reload(true);
            },
        	buttons: [{
                text: "OK",
                click: function() {
                    $(this).dialog('close');
                    location.reload(true);
                }
            }]
        });
}
function loadFile() {
    var files = document.getElementById('selectFiles').files;
    if (files.length <= 0) { return false; }
    
    var fr = new FileReader();
    fr.onload = function(e) { 
        var result = JSON.parse(e.target.result);        
        chrome.storage.sync.set({
            dataValues: JSON.stringify(result)
        }, function() {
            // Update status to let user know options were saved.
            alertaBoxPro('Sucess', 'check-circle', 'Configura\u00e7\u00f5es carregadas com sucesso!');
            //location.reload(true);
        });
    }
    fr.readAsText(files.item(0));
}

function downloadFile() {
    chrome.storage.sync.get({
        dataValues: ''
    }, function(items) {
        var filename = 'config.json';
        var jsonFile = items.dataValues
        var blob = new Blob([jsonFile], { type: 'application/json;charset=utf-8,%EF%BB%BF' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        location.reload(true);
    });
}
// Saves options to chrome.storage
function remove_options() {
        chrome.storage.sync.set({
            dataValues: ''
        }, function() {
            // Update status to let user know options were saved.
            alertaBoxPro('Sucess', 'check-circle', 'Configura\u00e7\u00f5es removidas com sucesso!');
            //location.reload(true); 
        });
}
function save_options(reload) {
    
	var dataValues = [];
    var checkInput = 0;
    $('.options-table').each(function(indexT){
		var input = {};
		$(this).find('.input-config-pro').each(function(indexI){
            $(this).removeClass('inputError');
			var value = $(this).val();
			var inputName = $(this).attr('data-name-input');
            if ($(this).prop('required') && value == '' ) { 
                $(this).addClass('inputError'); 
                checkInput++; 
            } else {
                input[inputName] = value;
            }
		});
		if ( checkInput == 0  ) { dataValues.push(input); }
    });
    dataValues.push({configGeral: changeConfigGeral()});
    saveAIPrompts();

    chrome.storage.sync.set({
        dataValues: JSON.stringify(dataValues)
    }, function() {
        // Update status to let user know options were saved.
        if ( reload == true ) { 
            alertaBoxPro('Sucess', 'check-circle', 'Configura\u00e7\u00f5es salvas com sucesso!');
            //location.reload(true); 
        } else { 
            downloadFile(); 
        }
    });
}

// Restores input text state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        dataValues: ''
    }, function(items) {

        var dataValues = ( items.dataValues != '' ) ? JSON.parse(items.dataValues) : [];    
            dataValues = jmespath.search(dataValues, "[?baseName]");
        
        for (i = 0; i < dataValues.length; i++) {
            if ( i > 0 ) { addProfile(); } else { actionRemoveProfile(i); }
        }
        $.each(dataValues, function (indexA, value) {
            $('#options-table-'+indexA).each(function(indexB){
                var nProfile = $(this);
                $.each(value, function (i, v) {
                    nProfile.find('.input-config-pro[data-name-input="'+i+'"]').val(v);
                });
                if (nProfile.find('.input-config-pro[data-name-input="spreadsheetId"]').val() != '') {
                    var conexaoTipo = nProfile.find('.sca-conexaoTipo')
                        conexaoTipo.val('sheets')
                        changeConexaoTipo(conexaoTipo);
                } else {
                    var typeApi = (nProfile.find('.input-config-pro[data-name-input="KEY_USER"]').val() == '') ? 'googleapi' : 'api';
                    var conexaoTipo = nProfile.find('.sca-conexaoTipo')
                        conexaoTipo.val(typeApi)
                        changeConexaoTipo(conexaoTipo);
                }
                changeBaseTipo(nProfile.find('.sca-baseTipo'));
            });
        });
        if (dataValues == null || dataValues.length == 0) {
            setTimeout(function(){ 
                console.log('dataValues**',dataValues);
                $('.sca-conexaoTipo').trigger('change');
            }, 500);
        }
        
        var dataValuesConfig = ( items.dataValues != '' ) ? JSON.parse(items.dataValues) : [];
            dataValuesConfig = jmespath.search(dataValuesConfig, "[*].configGeral | [0]");
            $.each(dataValuesConfig, function (indexB, value) {
                if (value.value === false) { 
                    $('#itemConfigGeral_'+value.name).prop('checked', false); 
                    $('#itemConfigGeral_'+value.name).closest('tr').find('.iconPopup').removeClass('azulColor').addClass('cinzaColor');
                } else if (value.value === true) {
                    $('#itemConfigGeral_'+value.name).prop('checked', true); 
                    $('#itemConfigGeral_'+value.name).closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
                }
            });
        if(jmespath.search(dataValuesConfig, "[?name=='newdocdefault'].value | [0]") || jmespath.search(dataValuesConfig, "[?name=='newdocdefault'].value | [0]") === null) {
            $('#newdocDefault_table').show();
        } else {
            $('#newdocDefault_table').hide();
        }
        if(jmespath.search(dataValuesConfig, "[?name=='uploaddocsexternos'].value | [0]") || jmespath.search(dataValuesConfig, "[?name=='uploaddocsexternos'].value | [0]") === null) {
            $('#uploadDoc_sortBefore').show();
        } else {
            $('#uploadDoc_sortBefore').hide();
        }
        if(jmespath.search(dataValuesConfig, "[?name=='reaberturaprogramada'].value | [0]") || jmespath.search(dataValuesConfig, "[?name=='reaberturaprogramada'].value | [0]") === null) {
            $('#reaberturaProgram_periodo').show();
        } else {
            $('#reaberturaProgram_periodo').hide();
        }
        if(jmespath.search(dataValuesConfig, "[?name=='certidaosigilo'].value | [0]") || jmespath.search(dataValuesConfig, "[?name=='certidaosigilo'].value | [0]") === null) {
            $('#getDocCertidao_docName').show();
        } else {
            $('#getDocCertidao_docName').hide();
        }
        if (jmespath.search(dataValuesConfig, "[?name=='newdocname'].value | [0]") !== null) { 
            $('#itemConfigGeral_newdocname')
                .val(jmespath.search(dataValuesConfig, "[?name=='newdocname'].value | [0]"))
                .closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
        }
        if (jmespath.search(dataValuesConfig, "[?name=='certidaosigilo_nomedoc'].value | [0]") !== null) { 
            $('#itemConfigGeral_certidaosigilo_nomedoc')
                .val(jmespath.search(dataValuesConfig, "[?name=='certidaosigilo_nomedoc'].value | [0]"))
                .closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
        }
        if (jmespath.search(dataValuesConfig, "[?name=='newdocobs'].value | [0]") !== null) { 
            $('#itemConfigGeral_newdocobs')
                .val(jmespath.search(dataValuesConfig, "[?name=='newdocobs'].value | [0]"))
                .closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
        }
        if (jmespath.search(dataValuesConfig, "[?name=='newdocespec'].value | [0]") !== null) { 
            $('#itemConfigGeral_newdocespec')
                .val(jmespath.search(dataValuesConfig, "[?name=='newdocespec'].value | [0]"))
                .closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
        }
        if (jmespath.search(dataValuesConfig, "[?name=='newdocformat'].value | [0]") !== null) { 
            $('#itemConfigGeral_newdocformat')
                .val(jmespath.search(dataValuesConfig, "[?name=='newdocformat'].value | [0]"))
                .closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
        }
        if (jmespath.search(dataValuesConfig, "[?name=='citacaodoc'].value | [0]") !== null) { 
            $('#itemConfigGeral_citacaodoc').val(jmespath.search(dataValuesConfig, "[?name=='citacaodoc'].value | [0]"));
        }
        if (jmespath.search(dataValuesConfig, "[?name=='combinacaoteclas'].value | [0]") !== null) { 
            $('#itemConfigGeral_combinacaoteclas').val(jmespath.search(dataValuesConfig, "[?name=='combinacaoteclas'].value | [0]"));
        }
        if (jmespath.search(dataValuesConfig, "[?name=='salvamentoautomatico'].value | [0]") !== null) { 
            $('#itemConfigGeral_salvamentoautomatico').val(jmespath.search(dataValuesConfig, "[?name=='salvamentoautomatico'].value | [0]"));
        }
        if (jmespath.search(dataValuesConfig, "[?name=='qualidadeimagens'].value | [0]") !== null) { 
            $('#itemConfigGeral_qualidadeimagens').val(jmespath.search(dataValuesConfig, "[?name=='qualidadeimagens'].value | [0]"));
        }
        if (jmespath.search(dataValuesConfig, "[?name=='reaberturaprogramada_periodo'].value | [0]") !== null) { 
            $('#itemConfigGeral_reaberturaprogramada_periodo').val(jmespath.search(dataValuesConfig, "[?name=='reaberturaprogramada_periodo'].value | [0]"));
        }
        if (jmespath.search(dataValuesConfig, "[?name=='newdocsigilo'].value | [0]") !== null) { 
            var valueNewDocSigilo = jmespath.search(dataValuesConfig, "[?name=='newdocsigilo'].value | [0]");
                valueNewDocSigilo = (valueNewDocSigilo != '' && valueNewDocSigilo.indexOf('|') !== -1) ? valueNewDocSigilo.split('|') : false;
                if (valueNewDocSigilo) {
                    $('#itemConfigGeral_newdocsigilo').append('<option value="'+valueNewDocSigilo[0]+'" selected>'+valueNewDocSigilo[2]+'</option>');
                    $('#itemConfigGeral_newdocsigilo').val(valueNewDocSigilo[0]);
                }
        }
        if(jmespath.search(dataValuesConfig, "[?name=='newdocnivel'].value | [0]") || jmespath.search(dataValuesConfig, "[?name=='newdocnivel'].value | [0]") === null) {
            $('#newDoc_sigilo').hide();
            $('#itemConfigGeral_newdocsigilo').html('<option value=""></option>').val(''); 
        } else {
            $('#newDoc_sigilo').show();
        }
        addActionsProfile();
        loadAIPrompts();
    });
}
function actionRemoveProfile(idTable) {
    $('#sca-upProfile-'+idTable).show().click(function() { 
        var up = $(this).closest('table').prev();
        if (typeof up !== 'undefined') $(this).closest('table').insertBefore(up).hide().fadeIn('slow').effect('highlight');
    });
    $('#sca-downProfile-'+idTable).show().click(function() { 
        var down = $(this).closest('table').next();
        if (typeof down !== 'undefined') $(this).closest('table').insertAfter(down).hide().fadeIn('slow').effect('highlight');
    });
    $('#sca-removeProfile-'+idTable).show().click(function() { 
        $('#options-table-'+idTable).effect('highlight').delay(1).effect('highlight');
        if ( $('.removeProfile').length > 1 ) {
            $('#options-table-'+idTable).fadeOut('slow', function() {
                $(this).remove();
                //  $('.save').removeClass('button-light');
            });
        } else {
            $('#options-table-'+idTable).find('.input-config-pro').val('');
            remove_options();
        }
    });
    $('.options-table').find('.input-config-pro').on('change', function() {
        // $('.save').removeClass('button-light');
    });
}
function addProfile() {
    var idTable = $('.options-table').length;
    $("#options-table-0").clone().attr('id', 'options-table-'+idTable).appendTo("#options-profile");
    $("#options-table-"+idTable).find('.input-config-pro').val('');
    $("#options-table-"+idTable).find('.option-ref').each(function(index){
        var idElement = $(this).attr('id').replace('-0', '-'+idTable);
        $(this).attr('id', idElement);
    });
    actionRemoveProfile(idTable);
    addActionsProfile();
}
function addActionsProfile() {
    $('.sca-conexaoTipo').unbind().on("change", function () {
        changeConexaoTipo(this);
    });
    $('.sca-baseTipo').unbind().on("change", function () {
        changeBaseTipo(this);
    });
    $('.passRevealBtn').unbind().on("click", function () {
        passReveal(this);
    })
    $('.passReveal').unbind().on("input", function () {
        passUpdate(this);
    });
}
function passUpdate(this_) {
    var _this = $(this_);
    var _parent = _this.closest('td');
    var show = _parent.find('input[type="text"].passReveal');
    var pass = _parent.find('input[type="password"].passReveal');
    var type = _this.attr('type');
    if (type == 'text') {
        pass.val(show.val());
    } else if (type == 'password') {
        show.val(pass.val());
    }
}
function changeConfigGeral() {
    var arrayShowItensMenu = [];
    $('#options-functions').find('input[name="infraAncoraSigla"]').each(function(){
        if ($(this).is(':checked')) {
            var value = true;
            $(this).closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
        } else {
            var value = false;
            $(this).closest('tr').find('.iconPopup').removeClass('azulColor').addClass('cinzaColor');
        }
        arrayShowItensMenu.push({name: $(this).attr('data-name'), value: value});
    });
    $('#options-complements').find('input[name="infraAncoraSigla"]').each(function(){
        if ($(this).is(':checked')) {
            var value = true;
            $(this).closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
        } else {
            var value = false;
            $(this).closest('tr').find('.iconPopup').removeClass('azulColor').addClass('cinzaColor');
        }
        arrayShowItensMenu.push({name: $(this).attr('data-name'), value: value});
    });
    $('#options-functions').find('input[type="text"]').each(function(){
        if ($(this).val() != '') {
            arrayShowItensMenu.push({name: $(this).attr('data-name'), value: $(this).val()});
        }
    });
    $('#options-functions').find('input[type="number"]').each(function(){
        if ($(this).val() != '') {
            arrayShowItensMenu.push({name: $(this).attr('data-name'), value: parseInt($(this).val())});
        }
    });
    $('#options-functions').find('select').each(function(){
        if ($(this).val() != '') {
            arrayShowItensMenu.push({name: $(this).attr('data-name'), value: $(this).val()});
        }
    });
    if ($('#itemConfigGeral_newdocdefault').is(':checked')) { $('#newdocDefault_table').show(); } else { $('#newdocDefault_table').hide(); } 
    if ($('#itemConfigGeral_uploaddocsexternos').is(':checked')) { 
        $('#uploadDoc_sortBefore').show(); 
    } else { 
        $('#uploadDoc_sortBefore').hide(); 
        $('#itemConfigGeral_sortbeforeupload').prop('checked',false); 
    }
    if ($('#itemConfigGeral_reaberturaprogramada').is(':checked')) { 
        $('#reaberturaProgram_periodo').show(); 
    } else { 
        $('#reaberturaProgram_periodo').hide(); 
    }
    if ($('#itemConfigGeral_certidaosigilo').is(':checked')) { 
        $('#getDocCertidao_docName').show(); 
    } else { 
        $('#getDocCertidao_docName').hide(); 
    }
    if ($('#itemConfigGeral_newdocnivel').is(':checked')) { 
        $('#newDoc_sigilo').hide(); 
        $('#itemConfigGeral_newdocsigilo').html('<option value=""></option>').val(''); 
    } else { 
        $('#newDoc_sigilo').show(); 
    }
    return arrayShowItensMenu;
}
function changeConexaoTipo(this_) {
    var _this = $(this_);
    var _parent = _this.closest('table');
    var mode = _this.val();
    if (mode == 'sheets') {
        _parent.find('tr.sheets').show();
        _parent.find('tr.api').hide().find('input').val('');
    } else if (mode == 'api') {
        _parent.find('tr.sheets').hide().find('input').val('');
        _parent.find('tr.api').show();
    } else if (mode == 'googleapi') {
        _parent.find('tr.sheets').not('.clientid').hide().find('input').val('');
        _parent.find('tr.api').show();
        _parent.find('tr.clientid').show();
        _parent.find('tr.api.keyuser').hide();
    }
}
function changeBaseTipo(this_) {
    var _this = $(this_);
    var _parent = _this.closest('table');
    var baseTipo = _this.val();
    if (baseTipo === 'openai' || baseTipo === 'gemini' || baseTipo === 'ollama') {
        _parent.find('tr.ai-platform').show();
    } else {
        _parent.find('tr.ai-platform').hide().find('input').val('');
    }
}
function passReveal(this_){
    var _this = $(this_);
    var _parent = _this.closest('td');
    var show = _parent.find('input[type="text"].passReveal'),
        pass = _parent.find('input[type="password"].passReveal'),
        showing = show.is(":visible"),
        from = showing ? show : pass,
        to = showing ? pass : show;
    from.hide();
    to.val(from.val()).show();
    _this.attr('class', showing ? 'option-ref passRevealBtn fas fa-eye' : 'option-ref passRevealBtn fas fa-eye-slash');
}
function getManifestExtension() {
    if (typeof browser === "undefined") {
        return chrome.runtime.getManifest();
    } else {
        return browser.runtime.getManifest();
    }
}
function setNamePage() {
    var manifest = getManifestExtension();
    var NAMESPACE_SPRO = manifest.short_name;
    var ICONSPACE_SPRO = manifest.icons['32'];
    var URLPages_SPRO = manifest.homepage_url;
    // var title = 'Configura\u00E7\u00F5es Gerais | '+NAMESPACE_SPRO;
    $('.title .name-space').text(NAMESPACE_SPRO);
    $('.icon-space').attr('src','../'+ICONSPACE_SPRO);
    $('a.manual').each(function(){
        $(this).attr('href', URLPages_SPRO+$(this).attr('href'));
    });
    if (NAMESPACE_SPRO == 'SEI Pro Lab') {
        $('body').addClass('SEIPro_lab');
    } else if (NAMESPACE_SPRO == 'ANTAQ Pro') {
        $('body').addClass('ANTAQ_Pro');
    } else if (NAMESPACE_SPRO == 'ANTT Pro') {
        $('body').addClass('ANTAQ_Pro');
    }
    console.log(manifest);
}
// =====================================================================
// GERENCIAMENTO DE PROMPTS DE IA
// =====================================================================
function escapeAttrPro(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function escapeHtmlPro(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function getDefaultAIPrompts() {
    return [
        {id: 'resume',               name: 'Resuma:',                      prompt: 'O texto abaixo \u00e9 um processo administrativo.\nResuma seu conte\u00fado detalhadamente, destacando os pontos principais, as partes envolvidas e as decis\u00f5es tomadas.'},
        {id: 'dados_sensiveis',      name: 'Dados sens\u00edveis (LGPD)',   prompt: 'Encontre dados sens\u00edveis no processo abaixo, de acordo com a LGPD.\nDados de empresas (nome, raz\u00e3o social, endere\u00e7o, CNPJ e s\u00f3cios) n\u00e3o s\u00e3o protegidos pela LGPD.\nCaso n\u00e3o encontre, diga apenas: "N\u00e3o foram encontrados dados sens\u00edveis no processo."\nCaso encontre, cite o nome do documento e liste os dados sens\u00edveis encontrados de forma objetiva.'},
        {id: 'discorra',             name: 'Discorra sobre:',               prompt: 'O texto abaixo \u00e9 um processo administrativo.\nDiscorra detalhadamente sobre o tema abordado, pesquisando fontes e base legal aplic\u00e1vel, citando legisla\u00e7\u00e3o pertinente.'},
        {id: 'erros_gramaticais',    name: 'Erros gramaticais:',            prompt: 'Encontre os erros gramaticais no texto abaixo.\nPara cada erro, cite o trecho com erro (tachado) e sua sugest\u00e3o de corre\u00e7\u00e3o (em negrito).'},
        {id: 'amplie',               name: 'Amplie o conte\u00fado',        prompt: 'Reescreva e amplie o texto a seguir, em voz ativa, com corre\u00e7\u00f5es gramaticais, citando as fontes e adicionando coes\u00e3o \u00e0s ora\u00e7\u00f5es.'},
        {id: 'linguagem_simples',    name: 'Linguagem simples',             prompt: 'Reformule o texto abaixo em linguagem simples, tornando-o acess\u00edvel ao p\u00fablico geral, sem jarg\u00f5es t\u00e9cnicos.'},
        {id: 'sugira_encaminhamento',name: 'Sugira encaminhamento:',        prompt: 'O texto abaixo \u00e9 um processo administrativo.\nCom base no seu est\u00e1gio atual, sugira os pr\u00f3ximos encaminhamentos mais adequados, com justificativa.'},
        {id: 'crie_parecer',         name: 'Crie um parecer t\u00e9cnico',  prompt: 'O texto abaixo \u00e9 um processo administrativo.\nCrie um Parecer t\u00e9cnico detalhado, cite fontes e legisla\u00e7\u00e3o, traga argumentos a favor e contr\u00e1rios sobre o tema.'},
        {id: 'base_legal',           name: 'Base legal do tema',            prompt: 'Identifique e explique a base legal aplic\u00e1vel ao tema do texto abaixo, citando legisla\u00e7\u00e3o, jurisprud\u00eancia e doutrina pertinentes.'},
        {id: 'analise_critica',      name: 'An\u00e1lise cr\u00edtica',     prompt: 'Fa\u00e7a uma an\u00e1lise cr\u00edtica detalhada sobre o tema do texto abaixo, avaliando pontos fortes, fracos, riscos e oportunidades.'},
        {id: 'palavras_chave',       name: 'Palavras-chave:',               prompt: 'Extraia as principais palavras-chave do texto abaixo, listando-as em ordem de relev\u00e2ncia.'},
        {id: 'traduza',              name: 'Traduza para portugu\u00eas',   prompt: 'Traduza para o portugu\u00eas brasileiro o texto abaixo, mantendo a fidelidade ao original.'},
        {id: 'topico',               name: 'Estrutura de t\u00f3picos:',    prompt: 'Crie uma estrutura organizada de t\u00f3picos e subt\u00f3picos sobre o conte\u00fado do texto abaixo.'},
        {id: 'converte_ata',         name: 'Converte em ata',               prompt: 'Converta o texto abaixo em uma ata de reuni\u00e3o formal, com: introdu\u00e7\u00e3o, participantes (se informados), pauta, delibera\u00e7\u00f5es e encaminhamentos.'}
    ];
}
function renderPromptsList(prompts) {
    var html = '';
    prompts.forEach(function(p, i) {
        html += '<tr class="prompt-row" data-id="' + escapeAttrPro(p.id) + '" style="border-bottom: 1px solid #eee;">'
            + '<td style="text-align:center; white-space:nowrap; padding: 4px 2px;">'
            +   '<i class="fas fa-arrow-up prompt-up" style="cursor:pointer; margin-right:4px; color:#666;" title="Mover para cima"></i>'
            +   '<i class="fas fa-arrow-down prompt-down" style="cursor:pointer; color:#666;" title="Mover para baixo"></i>'
            + '</td>'
            + '<td style="padding:3px 5px;">'
            +   '<input type="text" class="prompt-name" value="' + escapeAttrPro(p.name) + '" style="width:100%; font-size:12px;"/>'
            + '</td>'
            + '<td style="padding:3px 5px;">'
            +   '<textarea class="prompt-text" style="width:100%; height:52px; font-size:11px; resize:vertical;">' + escapeHtmlPro(p.prompt) + '</textarea>'
            + '</td>'
            + '<td style="text-align:center; padding:4px 2px;">'
            +   '<i class="fas fa-trash-alt prompt-delete" style="cursor:pointer; color:#c00;" title="Excluir prompt"></i>'
            + '</td>'
            + '</tr>';
    });
    $('#prompts-list').html(html);
}
function getPromptsFromUI() {
    var prompts = [];
    $('#prompts-list .prompt-row').each(function() {
        var id = $(this).data('id');
        var name = $(this).find('.prompt-name').val().trim();
        var prompt = $(this).find('.prompt-text').val().trim();
        if (name) {
            prompts.push({id: String(id), name: name, prompt: prompt});
        }
    });
    return prompts;
}
function loadAIPrompts() {
    if (typeof browser === "undefined") {
        chrome.storage.sync.get({aiPromptsPro: ''}, function(items) {
            var data = (items.aiPromptsPro && items.aiPromptsPro !== '') ? JSON.parse(items.aiPromptsPro) : {};
            $('#aiSystemInstruction').val(data.systemInstruction || '');
            renderPromptsList(data.prompts && data.prompts.length > 0 ? data.prompts : getDefaultAIPrompts());
        });
    } else {
        browser.storage.sync.get({aiPromptsPro: ''}).then(function(items) {
            var data = (items.aiPromptsPro && items.aiPromptsPro !== '') ? JSON.parse(items.aiPromptsPro) : {};
            $('#aiSystemInstruction').val(data.systemInstruction || '');
            renderPromptsList(data.prompts && data.prompts.length > 0 ? data.prompts : getDefaultAIPrompts());
        });
    }
}
function saveAIPrompts() {
    var prompts = getPromptsFromUI();
    var systemInstruction = $('#aiSystemInstruction').val().trim();
    var data = JSON.stringify({prompts: prompts, systemInstruction: systemInstruction});
    if (typeof browser === "undefined") {
        chrome.storage.sync.set({aiPromptsPro: data});
    } else {
        browser.storage.sync.set({aiPromptsPro: data});
    }
}
$(document).on('click', '#add-prompt', function() {
    var newId = 'custom_' + Date.now();
    var row = '<tr class="prompt-row" data-id="' + newId + '" style="border-bottom: 1px solid #eee;">'
        + '<td style="text-align:center; white-space:nowrap; padding: 4px 2px;">'
        +   '<i class="fas fa-arrow-up prompt-up" style="cursor:pointer; margin-right:4px; color:#666;" title="Mover para cima"></i>'
        +   '<i class="fas fa-arrow-down prompt-down" style="cursor:pointer; color:#666;" title="Mover para baixo"></i>'
        + '</td>'
        + '<td style="padding:3px 5px;"><input type="text" class="prompt-name" value="" placeholder="Nome do prompt" style="width:100%; font-size:12px;"/></td>'
        + '<td style="padding:3px 5px;"><textarea class="prompt-text" style="width:100%; height:52px; font-size:11px; resize:vertical;" placeholder="Texto do prompt enviado \u00e0 IA (o conte\u00fado do documento ser\u00e1 adicionado automaticamente)"></textarea></td>'
        + '<td style="text-align:center; padding:4px 2px;"><i class="fas fa-trash-alt prompt-delete" style="cursor:pointer; color:#c00;" title="Excluir prompt"></i></td>'
        + '</tr>';
    $('#prompts-list').append(row);
});
$(document).on('click', '.prompt-delete', function() {
    $(this).closest('tr').remove();
});
$(document).on('click', '.prompt-up', function() {
    var row = $(this).closest('tr');
    var prev = row.prev('.prompt-row');
    if (prev.length) row.insertBefore(prev);
});
$(document).on('click', '.prompt-down', function() {
    var row = $(this).closest('tr');
    var next = row.next('.prompt-row');
    if (next.length) row.insertAfter(next);
});
// =====================================================================

$('#options-functions').find('input[type="text"]').on("keyup", function () {
    if ($(this).val() != '') {
        $(this).closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
    } else {
        $(this).closest('tr').find('.iconPopup').removeClass('azulColor').addClass('cinzaColor');
    }
});
$('input[name="infraAncoraSigla"]').on("change", function () {
    changeConfigGeral();
});
$('.save').click(function() { save_options(true) });
$('#new').click(function() { addProfile() });

$(function(){
    restore_options();
    $('#options-tabs').tabs();
    $('#accordion').accordion({
        heightStyle: 'content',
        collapsible: true
      });
    setNamePage();
});