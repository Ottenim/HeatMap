am5.ready(function() {
    var root = am5.Root.new("chartdiv");

    // VARIÁVEL GLOBAL PARA ARMAZENAR TODOS OS DADOS, DADOS MOSTRADOS, DADOS ANTIGOS.

    var dados_todos, dados_antigos, dados_mostrados;
    
    const STRONG_RED = 0xff0000;
    const LIGHT_GREEN = 0x99ffbb;
    const LIGHT_RED = 0xff9999;
    const STRONG_GREEN = 0x009933;
    const GREY = 0xe6e6e6;

    const cancerRadio = document.querySelector('input[value="Cancer"]');
    const cryptoRadio = document.querySelector('input[value="Crypto"]');
    const cancerDeath = document.querySelector('input[value="Mortes"]');
    const cancerIncidence = document.querySelector('input[value="Incidence"]');
    const cancerOptions = document.getElementById('cancerOptions');
    const addBtn = document.getElementById('addBtn');
    const removeBtn = document.getElementById('removeBtn');
    const randomBtn = document.getElementById('randomBtn');
    var isCancer = false;

    //Inicializa os botões bloqueados:
    removeBtn.disabled = true;
    randomBtn.disabled = true;
    addBtn.disabled = true;

    function enableButtons(){
        removeBtn.disabled = false;
        randomBtn.disabled = false;
        addBtn.disabled = false;
    }

    // Event listener para os inputs "Cancer" e "Crypto"
    cancerRadio.addEventListener('change', function() {
        if (cancerRadio.checked) {
            cancerOptions.style.display = 'block';
            isCancer = true;
        } else {
            cancerOptions.style.display = 'none';
        }
    });

    // cryptoRadio.addEventListener('change', function() {
    //     if (cryptoRadio.checked) {
    //         cancerOptions.style.display = 'none';
    //         cancerDeath.checked = false;
    //         cancerIncidence.checked = false;
    //         isCancer = false;
    //         fetchCryptoData();
    //     }
    // });

    // Event listener para autorizar o processo dos dados selecionados
    document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.checked) {
                if (this.value == 'Mortes') {
                    loadCancerData('../data/DATA_DEATH_2019_BOTH.json', '../data/DATA_DEATH_2018_BOTH.json'); 
                    enableButtons();               
                }
                if (this.value == 'Incidence') {
                    loadCancerData('../data/DATA_INCIDENCE_2019_BOTH.json', '../data/DATA_INCIDENCE_2018_BOTH.json'); 
                    enableButtons();
                }
            }
        });
    });
    
    addBtn.addEventListener('click', function() {
        const select = document.getElementById('selectLocationAdd');
        const selectedLocation = select.value; // Valor da opção selecionada
    
        let objeto_encontrado = dados_todos.find(objeto => String(objeto.ID) === String(selectedLocation));
        if (objeto_encontrado) {
            dados_mostrados.push(objeto_encontrado);
            calcularVariacao();
        }

        setDataHeatMap();
    });
    
    removeBtn.addEventListener('click', function() {
        const select = document.getElementById('selectLocationRemove');
        const selectedLocation = select.value; // Valor da opção selecionada

        removeById(selectedLocation);

        setDataHeatMap();
    });

    randomBtn.addEventListener('click', function() {

        dados_mostrados = generateRandom(dados_todos, 15);
        
        calcularVariacao();

        setDataHeatMap();
    });

    const removeById = (id) => {
        const requiredIndex = dados_mostrados.findIndex(el => {
           return String(el.ID) === String(id);
        });
        if(requiredIndex === -1){
           return false;
        };
        return !!dados_mostrados.splice(requiredIndex, 1);
     };
   

    // PARTE JSON //
    // MANIPULAÇÃO DE ARQUIVOS JSON (DIRETÓRIO: DATA)
    function loadCancerData(file_1, file_2 ) {
        async function fetchData(url) {
            const response = await fetch(url);
            if (!response.ok) {
            throw new Error(`Erro ao buscar os dados de ${url}: ${response.statusText}`);
            }
            return response.json();
        }
        
        Promise.all([fetchData(file_1), fetchData(file_2)])
        .then(([all_data, antique_data]) => {
            
            dados_todos = all_data;
            dados_antigos = antique_data;

            dados_mostrados = generateRandom(dados_todos, 15);

            calcularVariacao();

            setDataHeatMap();

        })
        .catch(error => {
            console.error('Erro ao buscar dados: ', error);
            throw error;
        });
    }

    // Função para encontrar a diferença entre duas variáveis JSON
    function encontrarDiferenca(todos_dados, dados_mostrados) {
        return todos_dados.filter(item1 => !dados_mostrados.some(item2 => item2.ID === item1.ID));
    }

    // FUNÇÃO PARA RETORNAR N VALORES 'RANDOM' : ALEATÓRIOS --> Prédefinido para 15 no código
    function generateRandom(data, n) {

        if (n >= data.length) {
        return data; 
        }
    
        const dataCopy = [...data];
    
        try {
            for (let i = dataCopy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [dataCopy[i], dataCopy[j]] = [dataCopy[j], dataCopy[i]];
            }
        } catch (err) {
            console.log("Erro no generateRandom ", err);
        }

        const resultadosAleatorios = dataCopy.slice(0, n);
    
        return resultadosAleatorios;
    }

    //Função para calcular variação entre os dados antigos para com os novos.
    function calcularVariacao() {
        if (!dados_mostrados) {
            console.error('Dados mostrados não inicializados ');
            
        } else {
            dados_mostrados.forEach(item => {
            let objeto_encontrado = dados_antigos.find(objeto => objeto.ID === item.ID);
                if (objeto_encontrado) {

                    let correcaoMostrado = parseFloat(item.Value.replace(',', '.'));
                    let correcaoAntigo = parseFloat(objeto_encontrado.Value.replace(',', '.'));
                    let res = ((correcaoMostrado / correcaoAntigo ) * 100) - 100;

                    item.Variacao = res.round(2);

                } else {
                    alert('Id não encontrado - Função calcularVariacao()');
                }
            });
        }
        //adicionarCores();
    }

    //PROTOTYPE PARA ARREDONDAMENTO DE FLOAT
    Number.prototype.round = function(p) {
        p = p || 10;
        return parseFloat( this.toFixed(p) );
    };

    //FUNÇÃO PARA PREENCHER OS SELECTS.
    function preencherSelects() {
        if (isCancer) {
            const selectAdd = document.getElementById('selectLocationAdd');
            const selectRemove = document.getElementById('selectLocationRemove');
            
            selectAdd.innerHTML = '';
            selectRemove.innerHTML = '';

            let data = encontrarDiferenca(dados_todos, dados_mostrados);
            
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.ID; 
                option.text = item.Location; 
                selectAdd.appendChild(option);
            });

            dados_mostrados.forEach(item => {
                const option = document.createElement('option');
                option.value = item.ID; 
                option.text = item.Location; 
                selectRemove.appendChild(option);
            });
        }
    }


var container = root.container.children.push(
  am5.Container.new(root, {
    width: am5.percent(100),
    height: am5.percent(100),
    layout: root.verticalLayout
  })
);
var series = container.children.push(
        am5hierarchy.Treemap.new(root, {
            singleBranchOnly: false,
            downDepth: 1,
            upDepth: 1,
            initialDepth: 1,
            valueField: "Value",
            categoryField: "Location",
            childDataField: "children"
        })
    );
        
    root.setThemes([
        am5themes_Animated.new(root)
    ]);


    function setDataHeatMap() {
      
        var dadosSemVirgulas = dados_mostrados.map(item => {
            return {
              ...item,
              Value: item.Value.replace(/,/g, '')
            };
          });
          
        let jsonString = JSON.stringify(dadosSemVirgulas);
        let jsonValorSAspas = jsonString.replace(/"(\d+\.\d+)"/g, '$1');

        var refator =  [{
            "name": "Root",
            "children": JSON.parse(jsonValorSAspas)
        }];

        series.rectangles.template.adapters.add("fill", function(fill, target) {
            let v = target.dataItem.dataContext.Variacao;

            if (v <= 1 && v >= -1) {
                return am5.color(GREY); 
            }
            if(isCancer){
                if (v < -3) {
                    return am5.color(STRONG_GREEN);
                } else if (v < -1 && v >= -3) {
                    return am5.color(LIGHT_GREEN);
                } else if (v > 1 && v <= 3) {
                    return am5.color(LIGHT_RED);
                } else if (v > 3) {
                    return am5.color(STRONG_RED);
                }
            } else {
                if (v < -1 && v >= -3) {
                    return am5.color(LIGHT_RED);
                } else if (v < -3) {
                    return am5.color(STRONG_RED);
                } else if (v > 1 && v <= 3) {
                    return am5.color(LIGHT_GREEN);
                } else if (v > 3) {
                    return am5.color(STRONG_GREEN);
                }
            }
        });

        series.data.setAll(refator);
        series.set("selectedDataItem", series.dataItems[0]);

        series.nodes.template.set("tooltipText", "{Location}: {Variacao}%\n[bold]{sum}[/]");
        preencherSelects();
    };

});
